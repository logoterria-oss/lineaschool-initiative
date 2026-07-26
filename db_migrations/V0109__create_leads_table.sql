CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    parent_name TEXT NOT NULL DEFAULT '',
    student_name TEXT NOT NULL DEFAULT '',
    student_age TEXT NOT NULL DEFAULT '',
    contact TEXT NOT NULL DEFAULT '',
    request_date TEXT NOT NULL DEFAULT '',
    responsible TEXT NOT NULL DEFAULT '',
    processing_status TEXT NOT NULL DEFAULT '',
    lead_status TEXT NOT NULL DEFAULT '',
    diag_date TEXT NOT NULL DEFAULT '',
    report_link TEXT NOT NULL DEFAULT '',
    schedule TEXT NOT NULL DEFAULT '',
    teachers TEXT NOT NULL DEFAULT '',
    comment TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
