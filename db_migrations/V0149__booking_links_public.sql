-- Общая ссылка: одна на всех, работает без ограничения по числу заявок
ALTER TABLE booking_links
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;