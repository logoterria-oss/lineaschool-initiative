ALTER TABLE t_p93118852_lineaschool_initiati.fm_ano
    ADD COLUMN IF NOT EXISTS monthly_override NUMERIC(14,2) NULL,
    ADD COLUMN IF NOT EXISTS extra_one_time NUMERIC(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '';

INSERT INTO t_p93118852_lineaschool_initiati.fm_constants (key,label,value_num,value_text,unit,note) VALUES
('ano_one_time_sep','АНО разово, сентябрь 2026',17750,NULL,'rub','50% открытия'),
('ano_one_time_oct','АНО разово, октябрь 2026',17750,NULL,'rub','50% открытия'),
('ano_include_in_model','АНО включается в модель',NULL,'true','text','Отдельная строка в P&L и Cash Flow')
ON CONFLICT (key) DO NOTHING;