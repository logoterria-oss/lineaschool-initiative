ALTER TABLE t_p93118852_lineaschool_initiati.leads ADD COLUMN IF NOT EXISTS first_reply_at TIMESTAMPTZ NULL;
ALTER TABLE t_p93118852_lineaschool_initiati.leads ADD COLUMN IF NOT EXISTS first_reply_channel TEXT NULL;
ALTER TABLE t_p93118852_lineaschool_initiati.leads ADD COLUMN IF NOT EXISTS first_reply_text TEXT NULL;
ALTER TABLE t_p93118852_lineaschool_initiati.leads ADD COLUMN IF NOT EXISTS first_reply_after_our BOOLEAN NULL;