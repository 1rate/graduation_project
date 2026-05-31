CREATE TABLE users (
    id            UUID        PRIMARY KEY,
    username      TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    role          TEXT        NOT NULL CHECK (role IN ('admin', 'user')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Фиксированный каталог категорий из разных бизнес-доменов.
-- Админ назначает каждому пользователю подмножество через user_categories.
CREATE TABLE categories (
    id     SMALLSERIAL PRIMARY KEY,
    code   TEXT NOT NULL UNIQUE,
    name   TEXT NOT NULL,
    domain TEXT NOT NULL
);

CREATE TABLE user_categories (
    user_id     UUID     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id SMALLINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, category_id)
);

-- Каждое обращение принадлежит пользователю. Колонка nullable: сообщения,
-- созданные до введения авторизации, остаются без владельца.
ALTER TABLE messages ADD COLUMN user_id UUID REFERENCES users(id);
CREATE INDEX idx_messages_user_id ON messages (user_id);

INSERT INTO categories (code, name, domain) VALUES
    ('complaint',          'Жалоба',                          'общее'),
    ('gratitude',          'Благодарность',                   'общее'),
    ('question',           'Вопрос и консультация',           'общее'),
    ('suggestion',         'Предложение и идея',              'общее'),
    ('service_quality',    'Качество обслуживания',           'общее'),
    ('staff_complaint',    'Жалоба на сотрудника',            'общее'),
    ('document_request',   'Запрос документов и справок',     'общее'),
    ('partnership',        'Сотрудничество и партнёрство',    'общее'),
    ('other',              'Другое',                          'общее'),
    ('billing',            'Оплата и биллинг',                'финансы'),
    ('refund',             'Возврат средств',                 'финансы'),
    ('tariff',             'Тарифы и стоимость',              'финансы'),
    ('fraud',              'Мошенничество и спорные операции','финансы'),
    ('card_issue',         'Проблема с банковской картой',    'банкинг'),
    ('loan',               'Кредиты и займы',                 'банкинг'),
    ('deposit',            'Вклады и депозиты',               'банкинг'),
    ('account_block',      'Блокировка счёта',                'банкинг'),
    ('connection_quality', 'Качество связи и интернета',      'телеком'),
    ('mobile_service',     'Мобильная связь',                 'телеком'),
    ('roaming',            'Роуминг',                         'телеком'),
    ('equipment',          'Оборудование и SIM-карты',        'телеком'),
    ('order_status',       'Статус заказа',                   'e-commerce'),
    ('delivery',           'Доставка',                        'e-commerce'),
    ('product_quality',    'Качество товара',                 'e-commerce'),
    ('return_exchange',    'Возврат и обмен товара',          'e-commerce'),
    ('warranty',           'Гарантийное обслуживание',        'e-commerce'),
    ('registration',       'Регистрация и аккаунт',           'IT'),
    ('password_reset',     'Восстановление доступа',          'IT'),
    ('personal_data',      'Персональные данные',             'IT'),
    ('app_bug',            'Ошибка в приложении или на сайте','IT');
