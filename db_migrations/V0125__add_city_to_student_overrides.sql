-- Населённый пункт и часовой пояс, внесённые вручную в разделе «Ученики».
-- Приоритетнее данных из анкеты: анкета есть не у всех, а координатору
-- нужно указать город самому. Регион храним, чтобы передавать в CRM
-- строку того же вида, что и из анкеты: «г Новосибирск (Новосибирская обл, МСК+4)».
ALTER TABLE t_p93118852_lineaschool_initiati.student_overrides
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS city_region TEXT,
    ADD COLUMN IF NOT EXISTS city_timezone TEXT;