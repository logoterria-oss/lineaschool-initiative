-- Малышев Денис (плательщик) -> ученик Лука Карпиков
UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET name = 'Лука Карпиков'
WHERE id = 274 AND order_id = 'ORDER_1774009439439';

-- Добавить мартовскую оплату Скоковой (групповые)
INSERT INTO t_p93118852_lineaschool_initiati.payment_leads
(name, email, phone, plan, amount, order_id, created_at, paid_at, source)
VALUES
('Мира Скокова', '', '', '10 групповых занятий по 270р.', 2700.00, 'MANUAL_SKOKOVA_20260313', '2026-03-13 12:00:00', '2026-03-13 12:00:00', 'manual');

-- Перенести Сашу Глобина на апрель (01.04)
UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET paid_at = '2026-04-01 12:00:00'
WHERE id = 294 AND order_id = (SELECT order_id FROM t_p93118852_lineaschool_initiati.payment_leads WHERE id = 294);