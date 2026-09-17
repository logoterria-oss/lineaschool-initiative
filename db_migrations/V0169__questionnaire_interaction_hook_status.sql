ALTER TABLE parent_questionnaire
  ADD COLUMN IF NOT EXISTS interaction_sent_at timestamp NULL,
  ADD COLUMN IF NOT EXISTS interaction_dialog_id integer NULL,
  ADD COLUMN IF NOT EXISTS interaction_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interaction_error text NULL;

-- Уже существующие анкеты считаем доставленными, чтобы выгрузка
-- ?action=feed&status=new не отдала окну весь архив разом.
UPDATE parent_questionnaire
SET interaction_sent_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE interaction_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_questionnaire_interaction_new
  ON parent_questionnaire (id)
  WHERE interaction_sent_at IS NULL;
