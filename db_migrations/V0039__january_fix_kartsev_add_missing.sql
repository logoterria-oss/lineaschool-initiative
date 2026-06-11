UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET amount = 66595.68
WHERE name = 'Саша и Савелий Карцевы' AND paid_at >= '2026-01-01' AND paid_at < '2026-02-01';

INSERT INTO t_p93118852_lineaschool_initiati.payment_leads
  (name, email, phone, plan, amount, order_id, created_at, paid_at, source)
VALUES
  ('Федя Захаров', 'manual@lineaschool.ru', '-', '2 урока в неделю - 3 месяца', 15000, 'manual-jan-017', NOW(), '2026-01-20T09:00:00', 'manual'),
  ('Степа Ивашкин', 'manual@lineaschool.ru', '-', '3 урока в неделю - 1 месяц', 10960, 'manual-jan-025', NOW(), '2026-01-25T09:00:00', 'manual'),
  ('Вася Новиков', 'manual@lineaschool.ru', '-', 'Другое (пробный урок)', 1370, 'manual-jan-026', NOW(), '2026-01-27T09:00:00', 'manual');