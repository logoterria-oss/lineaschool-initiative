CREATE TABLE IF NOT EXISTS site_question_clicks (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(20) NOT NULL,
    used_dialog_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_question_clicks_open
    ON site_question_clicks (channel, created_at DESC)
    WHERE used_dialog_id IS NULL;

ALTER TABLE interaction_dialogs ADD COLUMN IF NOT EXISTS source VARCHAR(40);