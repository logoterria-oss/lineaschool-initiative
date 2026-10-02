-- Модуль «Постоянные расходы» (Промт 6)
ALTER TABLE t_p93118852_lineaschool_initiati.fm_expense_items ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE t_p93118852_lineaschool_initiati.fm_expense_items DROP CONSTRAINT IF EXISTS fm_expense_items_category_check;
ALTER TABLE t_p93118852_lineaschool_initiati.fm_expense_items ADD CONSTRAINT fm_expense_items_category_check CHECK (category IN ('fixed','variable','ano'));
UPDATE t_p93118852_lineaschool_initiati.fm_expense_items SET is_fixed = (input_mode = 'fixed');
UPDATE t_p93118852_lineaschool_initiati.fm_expense_items SET amount = 37500 WHERE id = 'neural_irregular';

INSERT INTO t_p93118852_lineaschool_initiati.fm_expense_items (id,name,category,input_mode,amount,amount_unit,sort,is_fixed) VALUES
('designers','Дизайнеры','fixed','manual',0,'rub_month',67,false),
('ano','АНО','ano','manual',NULL,'rub_month',300,false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE t_p93118852_lineaschool_initiati.fm_expense_monthly ADD COLUMN IF NOT EXISTS source VARCHAR(16) NOT NULL DEFAULT 'manual';
INSERT INTO t_p93118852_lineaschool_initiati.fm_expense_monthly (month_id,expense_id,amount,override,source,note)
VALUES ('2026-09','designers',30950,true,'manual','Факт сентября')
ON CONFLICT (month_id, expense_id) DO NOTHING;

ALTER TABLE t_p93118852_lineaschool_initiati.fm_monthly_inputs ADD COLUMN IF NOT EXISTS ruo_replacements INTEGER NULL;
ALTER TABLE t_p93118852_lineaschool_initiati.fm_monthly_inputs ADD COLUMN IF NOT EXISTS admin_rate_override NUMERIC(14,2) NULL;

INSERT INTO t_p93118852_lineaschool_initiati.fm_staff_monthly (staff_id,month_id,rate_override,note) VALUES
('targetologist','2026-09',12500,'В сентябре повышенная'),
('developer','2026-09',40000,'В сентябре пониженная')
ON CONFLICT (staff_id, month_id) DO UPDATE SET rate_override = EXCLUDED.rate_override, note = EXCLUDED.note;

INSERT INTO t_p93118852_lineaschool_initiati.fm_constants (key,label,value_num,unit,note) VALUES
('admin_shifts_default','Смен админов в месяц',30,'shift','1 админ на смене')
ON CONFLICT (key) DO NOTHING;

-- Рассчитанные выплаты сотрудникам (перезаписываются при каждом расчёте).
-- staff_id = id из fm_staff, для админов — сводный ключ 'admins' (1 админ на смене).
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_staff_monthly_payments (
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    staff_id VARCHAR(48) NOT NULL,
    scenario VARCHAR(8) NOT NULL CHECK (scenario IN ('min','base','opt')),
    base_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    insurance NUMERIC(14,2) NOT NULL DEFAULT 0,
    vacation NUMERIC(14,2) NOT NULL DEFAULT 0,
    bonus NUMERIC(14,2) NOT NULL DEFAULT 0,
    replacements NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (month_id, staff_id, scenario)
);