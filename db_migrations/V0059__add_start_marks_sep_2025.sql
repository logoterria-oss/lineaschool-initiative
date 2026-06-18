-- Стартовые отметки начала занятий (01.09.2025) для учеников, чьи ранние абонементы
-- не попали в базу платежей. amount=0, order_id с префиксом manual-start- для отличия.
INSERT INTO t_p93118852_lineaschool_initiati.payment_leads
  (name, email, phone, plan, amount, order_id, paid_at, source)
VALUES
  ('Настя Комарова', 'manual@lineaschool.ru', '-', '2 урока в неделю - 3 месяца', 0, 'manual-start-komarova', '2025-09-01 09:00:00', 'manual'),
  ('Марк и Сеня Константиновы', 'manual@lineaschool.ru', '-', '4 урока в неделю - 3 месяца', 0, 'manual-start-konstantinovy', '2025-09-01 09:00:00', 'manual'),
  ('Рома Жуков', 'manual@lineaschool.ru', '-', '2 урока в неделю - 1 месяц', 0, 'manual-start-zhukov', '2025-09-01 09:00:00', 'manual'),
  ('Рита Алексеева', 'manual@lineaschool.ru', '-', '2 урока в неделю - 3 месяца', 0, 'manual-start-alekseeva', '2025-09-01 09:00:00', 'manual'),
  ('Алёна Орлова', 'manual@lineaschool.ru', '-', '3 урока в неделю - 1 месяц', 0, 'manual-start-orlova', '2025-09-01 09:00:00', 'manual'),
  ('Федя Мазур', 'manual@lineaschool.ru', '-', '2 урока в неделю - 1 месяц', 0, 'manual-start-mazur', '2025-09-01 09:00:00', 'manual');