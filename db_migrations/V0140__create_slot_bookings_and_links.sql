CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.slot_bookings (
    id SERIAL PRIMARY KEY,
    token VARCHAR(64) NOT NULL,
    slot_date DATE NOT NULL,
    time_from VARCHAR(5) NOT NULL,
    time_to VARCHAR(5) NOT NULL,
    teacher_id INTEGER NOT NULL,
    teacher_name VARCHAR(200) NOT NULL DEFAULT '',
    child_name VARCHAR(200) NOT NULL,
    parent_name VARCHAR(200) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    comment TEXT DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    admin_note TEXT DEFAULT '',
    dialog_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by VARCHAR(200) DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_slot_bookings_status
    ON t_p93118852_lineaschool_initiati.slot_bookings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slot_bookings_slot
    ON t_p93118852_lineaschool_initiati.slot_bookings(slot_date, teacher_id, time_from);
CREATE INDEX IF NOT EXISTS idx_slot_bookings_token
    ON t_p93118852_lineaschool_initiati.slot_bookings(token);

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.booking_links (
    id SERIAL PRIMARY KEY,
    token VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL DEFAULT '',
    note TEXT DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT true,
    expires_at DATE,
    created_by VARCHAR(200) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_links_token
    ON t_p93118852_lineaschool_initiati.booking_links(token);
