package pgstore

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// ErrUserExists is returned by CreateUser when the username is already taken.
var ErrUserExists = errors.New("username already exists")

// User is a row of the users table. PasswordHash is never serialized to clients.
type User struct {
	ID           string
	Username     string
	PasswordHash string
	Role         string
	CreatedAt    time.Time
}

// Category is a row of the fixed categories catalog.
type Category struct {
	ID     int    `json:"id"`
	Code   string `json:"code"`
	Name   string `json:"name"`
	Domain string `json:"domain"`
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

// UpsertAdmin ensures an admin user with the given credentials exists. It is
// called at startup of the auth service with values from ADMIN_USERNAME /
// ADMIN_PASSWORD. If the user already exists its password hash is refreshed so
// that changing the env var takes effect on the next restart.
func (s *Store) UpsertAdmin(ctx context.Context, username, passwordHash string) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO users (id, username, password_hash, role)
		VALUES ($1, $2, $3, 'admin')
		ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
		uuid.New(), username, passwordHash,
	)
	if err != nil {
		return fmt.Errorf("pg upsert admin: %w", err)
	}
	return nil
}

// CreateUser inserts a new user. Returns ErrUserExists when the username is taken.
func (s *Store) CreateUser(ctx context.Context, id uuid.UUID, username, passwordHash, role string) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO users (id, username, password_hash, role)
		VALUES ($1, $2, $3, $4)`,
		id, username, passwordHash, role,
	)
	if isUniqueViolation(err) {
		return ErrUserExists
	}
	if err != nil {
		return fmt.Errorf("pg create user: %w", err)
	}
	return nil
}

func (s *Store) scanUser(row pgx.Row) (*User, error) {
	var u User
	err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("pg scan user: %w", err)
	}
	return &u, nil
}

// GetUserByUsername returns the user (incl. password hash) for login. ErrNotFound if absent.
func (s *Store) GetUserByUsername(ctx context.Context, username string) (*User, error) {
	return s.scanUser(s.pool.QueryRow(ctx, `
		SELECT id::text, username, password_hash, role, created_at
		FROM users WHERE username = $1`, username))
}

// GetUserByID returns the user by id. ErrNotFound if absent.
func (s *Store) GetUserByID(ctx context.Context, id string) (*User, error) {
	return s.scanUser(s.pool.QueryRow(ctx, `
		SELECT id::text, username, password_hash, role, created_at
		FROM users WHERE id = $1`, id))
}

// ListUsers returns all users ordered by creation time.
func (s *Store) ListUsers(ctx context.Context) ([]User, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id::text, username, password_hash, role, created_at
		FROM users ORDER BY created_at`)
	if err != nil {
		return nil, fmt.Errorf("pg list users: %w", err)
	}
	defer rows.Close()

	var out []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role, &u.CreatedAt); err != nil {
			return nil, fmt.Errorf("pg scan user: %w", err)
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

// ListCategories returns the full fixed catalog ordered by id.
func (s *Store) ListCategories(ctx context.Context) ([]Category, error) {
	rows, err := s.pool.Query(ctx, `SELECT id, code, name, domain FROM categories ORDER BY id`)
	if err != nil {
		return nil, fmt.Errorf("pg list categories: %w", err)
	}
	defer rows.Close()
	return scanCategories(rows)
}

// GetUserCategories returns the categories assigned to a user, ordered by id.
func (s *Store) GetUserCategories(ctx context.Context, userID string) ([]Category, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT c.id, c.code, c.name, c.domain
		FROM categories c
		JOIN user_categories uc ON uc.category_id = c.id
		WHERE uc.user_id = $1
		ORDER BY c.id`, userID)
	if err != nil {
		return nil, fmt.Errorf("pg get user categories: %w", err)
	}
	defer rows.Close()
	return scanCategories(rows)
}

func scanCategories(rows pgx.Rows) ([]Category, error) {
	out := []Category{}
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Code, &c.Name, &c.Domain); err != nil {
			return nil, fmt.Errorf("pg scan category: %w", err)
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

// SetUserCategories replaces the user's assigned categories with categoryIDs in
// a single transaction. An invalid category id fails the whole operation.
func (s *Store) SetUserCategories(ctx context.Context, userID uuid.UUID, categoryIDs []int) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("pg begin: %w", err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM user_categories WHERE user_id = $1`, userID); err != nil {
		return fmt.Errorf("pg clear user categories: %w", err)
	}
	for _, cid := range categoryIDs {
		if _, err := tx.Exec(ctx,
			`INSERT INTO user_categories (user_id, category_id) VALUES ($1, $2)`,
			userID, cid,
		); err != nil {
			return fmt.Errorf("pg assign category %d: %w", cid, err)
		}
	}
	return tx.Commit(ctx)
}
