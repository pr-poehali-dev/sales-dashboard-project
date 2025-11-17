-- Создание таблиц для системы управления заказами металлообработки

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_role CHECK (role IN ('ADMIN', 'MANAGER', 'TECHNOLOGIST', 'WORKER', 'USER'))
);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    deadline TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL REFERENCES users(id),
    CONSTRAINT check_status CHECK (status IN ('DRAFT', 'ACCEPTED', 'IN_PROGRESS', 'QUALITY_CHECK', 'COMPLETED', 'SHIPPED')),
    CONSTRAINT check_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'))
);

-- Таблица файлов
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_file_type CHECK (file_type IN ('DRAWING', 'SPECIFICATION', 'PHOTO', 'DOCUMENT'))
);

-- Таблица производственных этапов
CREATE TABLE IF NOT EXISTS production_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
    order_id INTEGER NOT NULL REFERENCES orders(id),
    assigned_to INTEGER REFERENCES users(id),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_stage_status CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'))
);

-- Таблица истории изменений заказов
CREATE TABLE IF NOT EXISTS order_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_deadline ON orders(deadline);
CREATE INDEX IF NOT EXISTS idx_files_order_id ON files(order_id);
CREATE INDEX IF NOT EXISTS idx_production_stages_order_id ON production_stages(order_id);
CREATE INDEX IF NOT EXISTS idx_production_stages_assigned_to ON production_stages(assigned_to);
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);