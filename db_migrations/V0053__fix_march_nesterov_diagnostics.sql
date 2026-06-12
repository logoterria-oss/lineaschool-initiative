-- Диагностика 30.03 принадлежит Нестерову Егору (стр.42 эталона), а не Корепанову
UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET name = 'Егор Нестеров'
WHERE id = 288 AND order_id = 'ORDER_1774852721386';