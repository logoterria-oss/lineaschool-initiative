ALTER TABLE teacher_absences ADD COLUMN IF NOT EXISTS substitute_name VARCHAR(120) NOT NULL DEFAULT '';

UPDATE teacher_absences SET substitute_name = 'Ирина Зинченко' WHERE id = 2;