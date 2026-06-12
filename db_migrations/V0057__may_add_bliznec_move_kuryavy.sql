-- Абонемент Близнеца Влада (оплата по реквизитам), 22.05
INSERT INTO t_p93118852_lineaschool_initiati.payment_leads
(name, email, phone, plan, amount, order_id, created_at, paid_at, source)
VALUES
('Влад Близнец', '', '', '2 урока в неделю - 1 месяц', 10960.00, 'manual-may-bliznec-2205', '2026-05-22 12:00:00', '2026-05-22 12:00:00', 'manual');

-- Курявый Миша (31.05) - реальная оплата относится к июню
UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET paid_at = '2026-06-01 12:00:00'
WHERE id = 461 AND name ILIKE '%курявый%';