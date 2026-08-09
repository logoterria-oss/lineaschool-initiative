-- Список учеников школы: нужен, чтобы обходить их порциями при сборе
-- периодов абонементов, не запрашивая весь список из CRM каждый раз.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.student_roster (
    customer_id INTEGER PRIMARY KEY,
    synced_at TIMESTAMP NOT NULL DEFAULT NOW()
);
