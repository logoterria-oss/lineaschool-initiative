ALTER TABLE t_p93118852_lineaschool_initiati.payment_leads
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);