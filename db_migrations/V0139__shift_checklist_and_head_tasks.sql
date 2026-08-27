-- Задачи, которые руководитель ставит администратору на конкретный день из календаря смен
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.shift_head_tasks (
    id SERIAL PRIMARY KEY,
    shift_date DATE NOT NULL,
    staff_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT (now() AT TIME ZONE 'Europe/Moscow')
);

CREATE INDEX IF NOT EXISTS idx_shift_head_tasks_date
    ON t_p93118852_lineaschool_initiati.shift_head_tasks (shift_date, staff_id);

-- Отметки администратора по чек-листу смены: галочка «выполнено» и комментарий
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.shift_checklist (
    id SERIAL PRIMARY KEY,
    shift_date DATE NOT NULL,
    staff_id INTEGER NOT NULL,
    -- код пункта из постоянного чек-листа либо head-<id> для задачи руководителя
    item_key TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    comment TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP DEFAULT (now() AT TIME ZONE 'Europe/Moscow'),
    UNIQUE (shift_date, staff_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_shift_checklist_date
    ON t_p93118852_lineaschool_initiati.shift_checklist (shift_date, staff_id);
