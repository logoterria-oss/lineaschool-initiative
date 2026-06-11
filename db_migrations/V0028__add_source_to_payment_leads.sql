ALTER TABLE payment_leads ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'acquiring';

COMMENT ON COLUMN payment_leads.source IS 'Источник оплаты: acquiring (интернет-эквайринг) или manual (ручной ввод руководителем)';