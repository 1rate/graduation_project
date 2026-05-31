DROP INDEX IF EXISTS idx_messages_user_id;
ALTER TABLE messages DROP COLUMN IF EXISTS user_id;
DROP TABLE IF EXISTS user_categories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
