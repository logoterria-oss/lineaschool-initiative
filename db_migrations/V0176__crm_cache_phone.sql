-- Телефон клиента нужен «Окну взаимодействия»: по нему оно находит диалог,
-- чтобы положить карточку оплаты в существующий чат, а не создавать дубль.
ALTER TABLE crm_customers_cache ADD COLUMN IF NOT EXISTS phone VARCHAR(32);

CREATE INDEX IF NOT EXISTS idx_crm_cache_phone ON crm_customers_cache (phone);

COMMENT ON COLUMN crm_customers_cache.phone IS 'Первый телефон карточки в формате 7XXXXXXXXXX';