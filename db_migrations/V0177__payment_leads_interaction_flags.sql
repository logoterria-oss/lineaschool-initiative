-- Отметки доставки карточки оплаты в «Окно взаимодействия».
-- По ним отдаём в feed только то, что ещё не доехало.
ALTER TABLE payment_leads ADD COLUMN IF NOT EXISTS interaction_sent_at TIMESTAMP;
ALTER TABLE payment_leads ADD COLUMN IF NOT EXISTS interaction_dialog_id VARCHAR(64);
ALTER TABLE payment_leads ADD COLUMN IF NOT EXISTS interaction_error VARCHAR(500);

-- Быстрый отбор недоставленных оплат для страховочной выгрузки
CREATE INDEX IF NOT EXISTS idx_payment_leads_interaction
  ON payment_leads (interaction_sent_at)
  WHERE paid_at IS NOT NULL;

COMMENT ON COLUMN payment_leads.interaction_sent_at IS 'Когда карточка оплаты ушла в Окно взаимодействия';