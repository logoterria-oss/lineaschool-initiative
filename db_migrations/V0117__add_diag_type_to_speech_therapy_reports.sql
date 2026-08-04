ALTER TABLE t_p93118852_lineaschool_initiati.speech_therapy_reports
ADD COLUMN IF NOT EXISTS diag_type VARCHAR(20) NOT NULL DEFAULT 'primary';

COMMENT ON COLUMN t_p93118852_lineaschool_initiati.speech_therapy_reports.diag_type IS 'Тип диагностики: primary — первичная, interim — промежуточная';