ALTER TABLE payment_leads ADD COLUMN IF NOT EXISTS crm_name VARCHAR(255);

COMMENT ON COLUMN payment_leads.name IS 'Имя, которое родитель ввёл на странице оплаты — всегда как есть';
COMMENT ON COLUMN payment_leads.crm_name IS 'Карточка в AlfaCRM, если удалось надёжно сопоставить; NULL — не нашли';