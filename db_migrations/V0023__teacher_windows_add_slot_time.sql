ALTER TABLE teacher_windows ADD COLUMN IF NOT EXISTS slot_time TIME;

ALTER TABLE teacher_windows
    ADD CONSTRAINT teacher_windows_unique_slot
    UNIQUE (teacher_name_normalized, weekday, slot_time);
