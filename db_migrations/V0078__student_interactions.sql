-- Взаимодействия с учениками: запрос (родитель/педагог/админ) + дата + текст + галочка "сделано"
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.student_interactions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    request_source VARCHAR(20) NOT NULL DEFAULT 'parent', -- parent | teacher | admin
    request_date DATE,
    request_text TEXT DEFAULT '',
    done BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_student_interactions_student
    ON t_p93118852_lineaschool_initiati.student_interactions(student_id);

-- Ответы на взаимодействие (несколько): кто ответил + дата + текст
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.student_interaction_replies (
    id SERIAL PRIMARY KEY,
    interaction_id INTEGER NOT NULL,
    reply_source VARCHAR(20) NOT NULL DEFAULT 'parent', -- parent | teacher | admin
    reply_date DATE,
    reply_text TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interaction_replies_interaction
    ON t_p93118852_lineaschool_initiati.student_interaction_replies(interaction_id);

-- Статус "ок/не ок" по ученику. NULL/true => ок, false => "не ок" (поднять вверх списка).
ALTER TABLE t_p93118852_lineaschool_initiati.student_overrides
    ADD COLUMN IF NOT EXISTS interaction_ok BOOLEAN;
