-- Заявки одной отправки объединяются в одну карточку у администратора
ALTER TABLE slot_bookings
  ADD COLUMN IF NOT EXISTS batch_id VARCHAR(40);

CREATE INDEX IF NOT EXISTS idx_slot_bookings_batch
  ON slot_bookings(batch_id);