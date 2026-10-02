CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_credit_schedule (
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    option VARCHAR(3) NOT NULL CHECK (option IN ('6m','12m')),
    interest NUMERIC(14,2) NOT NULL DEFAULT 0,
    body NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    balance_after NUMERIC(14,2) NOT NULL DEFAULT 0,
    status VARCHAR(8) NOT NULL CHECK (status IN ('active','closed')),
    calculated_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (month_id, option)
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_constants (key,label,value_num,value_text,value_date,unit,needs_clarification,note) VALUES
('credit_contract','Кредитный договор',NULL,'№ 7037974160 от 17.09.2026',NULL,'text',false,'Оборотный кредит'),
('credit_option_default','Вариант погашения кредита',NULL,'6m',NULL,'text',false,'6m / 12m')
ON CONFLICT (key) DO NOTHING;