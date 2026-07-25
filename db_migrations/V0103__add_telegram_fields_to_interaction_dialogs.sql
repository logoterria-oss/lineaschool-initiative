ALTER TABLE interaction_dialogs
  ADD COLUMN IF NOT EXISTS tg_chat_id character varying,
  ADD COLUMN IF NOT EXISTS tg_username character varying;

CREATE INDEX IF NOT EXISTS idx_interaction_dialogs_tg_chat_id ON interaction_dialogs (tg_chat_id);
CREATE INDEX IF NOT EXISTS idx_interaction_dialogs_tg_username ON interaction_dialogs (lower(tg_username));