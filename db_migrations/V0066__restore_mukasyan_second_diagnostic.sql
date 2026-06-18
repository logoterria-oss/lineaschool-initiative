-- Restore Mukasyan second diagnostic payment (two children = two legit diagnostics).
-- It was wrongly treated as a duplicate and removed; bring it back with original data.
INSERT INTO t_p93118852_lineaschool_initiati.payment_leads
    (name, email, phone, plan, amount, order_id, created_at, paid_at, transaction_id, source)
VALUES
    ('Гриша и Катя Мукасьян', '', '', 'Диагностика - Диагностика + консультация',
     1290.00, 'ORDER_1771786585403', '2026-02-22 18:56:25.403000', '2026-02-23 12:00:00', NULL, 'acquiring');

-- Remove it from the blocklist so it is treated as a normal payment again.
UPDATE t_p93118852_lineaschool_initiati.payment_blocklist
SET order_id = NULL, transaction_id = NULL, reason = 'restored'
WHERE order_id = 'ORDER_1771786585403';