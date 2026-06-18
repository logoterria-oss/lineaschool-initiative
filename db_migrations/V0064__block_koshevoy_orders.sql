-- Add Koshevoy's buggy payment orders to the blocklist so mail sync never restores them.
INSERT INTO t_p93118852_lineaschool_initiati.payment_blocklist (order_id, transaction_id, name, reason)
SELECT order_id, NULL, name, 'koshevoy_bug'
FROM t_p93118852_lineaschool_initiati.payment_leads
WHERE name ILIKE '%кошевой%' AND id <> 402;

-- Also block the original bank transaction id that was wrongly attached.
INSERT INTO t_p93118852_lineaschool_initiati.payment_blocklist (order_id, transaction_id, name, reason)
VALUES (NULL, '7966299118', 'Кошевой Степан Денисович', 'koshevoy_bug');