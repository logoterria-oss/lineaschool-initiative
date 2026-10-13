-- 13.10.2026 уже работали по новому графику: Анастасия 09–12, Анна 12–20
UPDATE t_p93118852_lineaschool_initiati.admin_shifts
SET time_from = '09:00', time_to = '12:00', updated_at = now()
WHERE shift_date = '2026-10-13' AND staff_id = 12;

UPDATE t_p93118852_lineaschool_initiati.admin_shifts
SET time_from = '12:00', time_to = '20:00', updated_at = now()
WHERE shift_date = '2026-10-13' AND staff_id = 14;