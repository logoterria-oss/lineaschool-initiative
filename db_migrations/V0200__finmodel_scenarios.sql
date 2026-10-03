-- Промт 14. Сценарии (встроенные мин/база/опт + пользовательские), результаты и таблицы чувствительности.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_scenarios (
    id VARCHAR(40) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    growth_coef NUMERIC(6,4) NOT NULL DEFAULT 1.4,
    price_change_pct NUMERIC(8,4) NOT NULL DEFAULT 0,
    students_override INTEGER NULL,
    advertising_override NUMERIC(14,2) NULL,
    staff_changes JSONB NOT NULL DEFAULT '{}'::jsonb,
    credit_option VARCHAR(4) NULL,
    payout_pct NUMERIC(8,4) NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_builtin BOOLEAN NOT NULL DEFAULT false,
    note VARCHAR(300) NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_scenario_results (
    scenario_id VARCHAR(40) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_scenarios(id),
    metric VARCHAR(40) NOT NULL,
    period VARCHAR(10) NOT NULL,
    value NUMERIC(16,2) NULL,
    calculated_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (scenario_id, metric, period)
);

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_sensitivity_tables (
    id VARCHAR(40) PRIMARY KEY,
    parameter VARCHAR(20) NOT NULL,
    "values" JSONB NOT NULL DEFAULT '[]'::jsonb,
    results JSONB NOT NULL DEFAULT '{}'::jsonb,
    calculated_at TIMESTAMP NOT NULL DEFAULT now()
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_scenarios (id, name, growth_coef, is_default, is_builtin, sort, note) VALUES
 ('min',  'Минимальный',   1.2, false, true, 1, 'Пессимистичный: рост слабый, учеников меньше'),
 ('base', 'Базовый',       1.4, true,  true, 2, 'Основной: ожидаемый рост'),
 ('opt',  'Оптимистичный', 1.6, false, true, 3, 'Хороший: рост быстрее, учеников больше')
ON CONFLICT (id) DO NOTHING;

INSERT INTO t_p93118852_lineaschool_initiati.fm_scenarios (id, name, growth_coef, price_change_pct, advertising_override, staff_changes, credit_option, payout_pct, sort, note) VALUES
 ('u_staff4',   '+4 сотрудника', 1.4, 0,   NULL,  '{"teachers": 4}'::jsonb, NULL,  NULL, 10, '4 педагога в найм'),
 ('u_price10',  'Цена −10%',     1.4, -10, NULL,  '{}'::jsonb,              NULL,  NULL, 11, 'Абонемент 13 500 ₽'),
 ('u_ads50',    'Реклама −50%',  1.4, 0,   37500, '{}'::jsonb,              NULL,  NULL, 12, 'Реклама 37 500 ₽/мес'),
 ('u_credit12', 'Кредит 12 мес', 1.4, 0,   NULL,  '{}'::jsonb,              '12m', NULL, 13, 'Тело 75 900 ₽/мес'),
 ('u_payout0',  'Выплата 0%',    1.4, 0,   NULL,  '{}'::jsonb,              NULL,  0,    14, 'Без выплаты собственнику')
ON CONFLICT (id) DO NOTHING;

INSERT INTO t_p93118852_lineaschool_initiati.fm_constants (key, label, value_num, unit, note) VALUES
 ('avg_subscription_price', 'Средняя цена абонемента', 15000, 'rub', 'База для чувствительности к цене'),
 ('students_current', 'Активных учеников сейчас', 42, 'pcs', 'База для чувствительности к ученикам'),
 ('teacher_hire_monthly_cost', 'Педагог в найм: оклад + страховые + отпускные', 60000, 'rub', 'Добавляется к постоянным расходам за каждого педагога'),
 ('scenario_near_zero_rub', 'Порог «близко к нулю» для цветовой индикации', 100000, 'rub', '')
ON CONFLICT (key) DO NOTHING;
