-- Тип занятия в заявке: индивидуальное или групповое
ALTER TABLE slot_bookings
  ADD COLUMN IF NOT EXISTS lesson_type VARCHAR(20) NOT NULL DEFAULT 'individual';

-- Дата, с которой родитель готов начать заниматься
ALTER TABLE slot_bookings
  ADD COLUMN IF NOT EXISTS start_from DATE;