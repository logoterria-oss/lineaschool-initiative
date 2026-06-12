-- Кошевой не покупал абонементы (ложные матчи mail-payment-sync). Оставляем только диагностику (id 402)
UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET paid_at = NULL, transaction_id = NULL
WHERE id IN (169, 277)
  AND name ILIKE '%кошев%'
  AND plan ILIKE '%урока%';