-- Новый формат администрирования с 14.10.2026:
-- пн–пт Федорова Анастасия 09–12 и Хорунжева Анна 12–20,
-- сб — руководитель (Абраменко В.), вс — РУО (Зинченко И.).
-- Уже поставленные неотмеченные смены переназначаем, отмеченные дни не трогаем.
WITH tpl AS (
  SELECT d::date AS day,
         CASE EXTRACT(ISODOW FROM d) WHEN 6 THEN '79236251611' WHEN 7 THEN '79879500712' ELSE '79236138874' END AS phone,
         '09:00' AS time_from,
         CASE WHEN EXTRACT(ISODOW FROM d) IN (6, 7) THEN '20:00' ELSE '12:00' END AS time_to
  FROM generate_series('2026-10-14'::date, '2026-12-31'::date, interval '1 day') d
)
UPDATE t_p93118852_lineaschool_initiati.admin_shifts sh
SET staff_id = s.id, staff_name = s.full_name, time_from = tpl.time_from, time_to = tpl.time_to,
    kind = 'work', updated_at = now()
FROM tpl
JOIN t_p93118852_lineaschool_initiati.staff s ON s.phone = tpl.phone AND s.status = 'active'
WHERE sh.shift_date = tpl.day
  AND sh.started_at IS NULL AND sh.finished_at IS NULL
  AND (SELECT count(*) FROM t_p93118852_lineaschool_initiati.admin_shifts x WHERE x.shift_date = tpl.day) = 1;

INSERT INTO t_p93118852_lineaschool_initiati.admin_shifts (staff_id, staff_name, shift_date, time_from, time_to, kind)
SELECT s.id, s.full_name, d::date, t.time_from, t.time_to, 'work'
FROM generate_series('2026-10-14'::date, '2026-12-31'::date, interval '1 day') d
JOIN (VALUES
  ('79236138874', '09:00', '12:00', 1), ('79236138874', '09:00', '12:00', 2),
  ('79236138874', '09:00', '12:00', 3), ('79236138874', '09:00', '12:00', 4),
  ('79236138874', '09:00', '12:00', 5),
  ('79277601832', '12:00', '20:00', 1), ('79277601832', '12:00', '20:00', 2),
  ('79277601832', '12:00', '20:00', 3), ('79277601832', '12:00', '20:00', 4),
  ('79277601832', '12:00', '20:00', 5),
  ('79236251611', '09:00', '20:00', 6),
  ('79879500712', '09:00', '20:00', 7)
) AS t(phone, time_from, time_to, dow) ON t.dow = EXTRACT(ISODOW FROM d)
JOIN t_p93118852_lineaschool_initiati.staff s ON s.phone = t.phone AND s.status = 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM t_p93118852_lineaschool_initiati.admin_shifts x
  WHERE x.shift_date = d::date AND (x.started_at IS NOT NULL OR x.finished_at IS NOT NULL)
)
ON CONFLICT (staff_id, shift_date) DO NOTHING;