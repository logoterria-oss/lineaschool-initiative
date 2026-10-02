ALTER TABLE t_p93118852_lineaschool_initiati.fm_monthly_inputs ADD COLUMN IF NOT EXISTS payout_manual NUMERIC(14,2) NULL;

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_payouts_monthly (
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    scenario VARCHAR(4) NOT NULL CHECK (scenario IN ('min','base','opt')),
    revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    payout_pct NUMERIC(7,4) NOT NULL,
    payout_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    payout_manual NUMERIC(14,2) NULL,
    payout_final NUMERIC(14,2) NOT NULL DEFAULT 0,
    source VARCHAR(12) NOT NULL DEFAULT 'calculated' CHECK (source IN ('calculated','manual')),
    calculated_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (month_id, scenario)
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_constants (key,label,value_num,value_text,unit,note) VALUES
('payout_base','База выплаты собственнику',NULL,'revenue','text','Поступления = аванс − эквайринг'),
('payout_target_monthly','Цель выплаты собственнику в месяц',250000,NULL,'rub','Для сравнения')
ON CONFLICT (key) DO NOTHING;