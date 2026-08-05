ALTER TABLE t_p93118852_lineaschool_initiati.speech_therapy_reports
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS archived_by VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_speech_reports_archived_at
    ON t_p93118852_lineaschool_initiati.speech_therapy_reports (archived_at);
