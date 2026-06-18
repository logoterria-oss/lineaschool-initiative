-- Обнуляем сумму оплаты Феди Мазура (id=602): запись нужна только для коэффициента
-- удержания (дата + тариф), но не должна влиять на финансовые/авансовые отчёты.
UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET amount = 0
WHERE order_id = 'manual-mazur-oct';