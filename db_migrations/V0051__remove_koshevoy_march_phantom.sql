-- Кошевой (20.03, 10960) - фантом, нет в эталоне
UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET paid_at = NULL, transaction_id = NULL
WHERE id = 277 AND name ILIKE '%кошев%';