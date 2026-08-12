ALTER TABLE t_p93118852_lineaschool_initiati.speech_therapy_reports
ADD COLUMN IF NOT EXISTS public_code VARCHAR(6);

CREATE UNIQUE INDEX IF NOT EXISTS idx_str_public_code
ON t_p93118852_lineaschool_initiati.speech_therapy_reports (public_code)
WHERE public_code IS NOT NULL;