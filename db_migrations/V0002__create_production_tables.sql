-- Таблица настроек производства (станки, операторы)
CREATE TABLE IF NOT EXISTS production_settings (
    id SERIAL PRIMARY KEY,
    machines TEXT[] NOT NULL DEFAULT '{}',
    operators TEXT[] NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставляем дефолтные настройки
INSERT INTO production_settings (machines, operators) 
VALUES (
    ARRAY['Станок №1', 'Станок №2', 'Станок №3'],
    ARRAY['Иванов И.И.', 'Петров П.П.', 'Сидоров С.С.', 'Кузнецов К.К.']
);

-- Таблица производственных заданий
CREATE TABLE IF NOT EXISTS production_tasks (
    id SERIAL PRIMARY KEY,
    day_of_week VARCHAR(2) NOT NULL CHECK (day_of_week IN ('Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс')),
    scheduled_date DATE,
    part_name VARCHAR(255) NOT NULL,
    planned_quantity INTEGER NOT NULL CHECK (planned_quantity > 0),
    time_per_part INTEGER NOT NULL CHECK (time_per_part > 0),
    machine VARCHAR(100) NOT NULL,
    operator VARCHAR(100) NOT NULL,
    actual_quantity INTEGER DEFAULT 0,
    archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица чертежей (файлы могут быть прикреплены к заданиям)
CREATE TABLE IF NOT EXISTS production_blueprints (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_tasks_day ON production_tasks(day_of_week);
CREATE INDEX IF NOT EXISTS idx_tasks_machine ON production_tasks(machine);
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON production_tasks(archived);
CREATE INDEX IF NOT EXISTS idx_blueprints_task ON production_blueprints(task_id);