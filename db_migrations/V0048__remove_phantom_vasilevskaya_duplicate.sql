-- id 211 (27.02) - фантомный дубль диагностики Василевской (нет транзакции, нет в эталоне). Убираем.
UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET paid_at = NULL
WHERE id = 211 AND order_id = 'ORDER_1772219454169';

-- Эталонную запись (id 215, 28.02) вернуть к имени как в других местах (оставляем ФИО как в эталоне)
UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET name = 'Ярослава Василевская'
WHERE id = 215 AND order_id = 'ORDER_1772302570076';