CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.letterhead_docs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  doc_number TEXT NOT NULL DEFAULT '',
  doc_date DATE,
  recipient TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  signer_post TEXT NOT NULL DEFAULT '',
  signer_name TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  stamp_mode TEXT NOT NULL DEFAULT 'none',
  file_name TEXT NOT NULL DEFAULT '',
  pdf_url TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_letterhead_docs_created
  ON t_p93118852_lineaschool_initiati.letterhead_docs (created_at DESC);
