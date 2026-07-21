ALTER TABLE t_p93118852_lineaschool_initiati.staff
  ADD COLUMN IF NOT EXISTS email varchar(255),
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.staff_email_codes (
  id serial PRIMARY KEY,
  staff_id integer NOT NULL,
  code_hash varchar(255) NOT NULL,
  expires_at timestamp NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_email_codes_staff ON t_p93118852_lineaschool_initiati.staff_email_codes(staff_id);