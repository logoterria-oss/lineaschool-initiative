ALTER TABLE t_p93118852_lineaschool_initiati.leads
  ADD COLUMN IF NOT EXISTS became_client_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS crm_customer_id INTEGER NULL;