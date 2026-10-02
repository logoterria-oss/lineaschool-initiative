CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_taxes_monthly (
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    scenario VARCHAR(4) NOT NULL CHECK (scenario IN ('min','base','opt')),
    regime VARCHAR(8) NOT NULL CHECK (regime IN ('usn','patent')),
    base NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax_gross NUMERIC(14,2) NOT NULL DEFAULT 0,
    social_fund NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax_net NUMERIC(14,2) NOT NULL DEFAULT 0,
    source VARCHAR(12) NOT NULL DEFAULT 'calculated' CHECK (source IN ('calculated','override')),
    calculated_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (month_id, scenario)
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_constants (key,label,value_num,value_text,unit,needs_clarification,note) VALUES
('tax_regime_default_before','Режим до перехода',NULL,'usn','text',false,'До ноября 2026 включительно'),
('tax_regime_default_after','Режим после перехода',NULL,'patent','text',false,'С декабря 2026'),
('start_patent_month','Месяц перехода на патент',NULL,'2026-12','month',false,''),
('max_deduction_pct','Максимум уменьшения налога на взносы',50,NULL,'%',false,'Налог = max(исходный − СФ, исходный × 50%)')
ON CONFLICT (key) DO NOTHING;

UPDATE t_p93118852_lineaschool_initiati.fm_constants
SET note = 'В P&L — равномерно 6 525 ₽/мес; график оплаты уточнить'
WHERE key = 'patent_payment_schedule';