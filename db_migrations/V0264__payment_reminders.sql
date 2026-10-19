CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.payment_reminders (
    id SERIAL PRIMARY KEY,
    crm_customer_id INTEGER NOT NULL,
    kind VARCHAR(8) NOT NULL,
    fingerprint VARCHAR(200) NOT NULL DEFAULT '',
    status VARCHAR(16) NOT NULL DEFAULT 'sent',
    channel VARCHAR(32),
    staff_id INTEGER,
    staff_name VARCHAR(200),
    student_name VARCHAR(300),
    message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Moscow'),
    sent_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_customer ON t_p93118852_lineaschool_initiati.payment_reminders (crm_customer_id, kind);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_created ON t_p93118852_lineaschool_initiati.payment_reminders (created_at);