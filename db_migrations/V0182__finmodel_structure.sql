-- ФИНМОДЕЛЬ: структура хранения (без расчётов). Префикс fm_. Проценты «как написано»: 3.19 = 3,19 %.
-- is_current / is_future у месяцев НЕ хранятся — вычисляются в коде по текущей дате.

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_constants (
    key VARCHAR(64) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    value_num NUMERIC(14,4) NULL,
    value_text VARCHAR(255) NULL,
    value_date DATE NULL,
    unit VARCHAR(16) NOT NULL,
    needs_clarification BOOLEAN NOT NULL DEFAULT false,
    note TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_constants (key,label,value_num,value_text,value_date,unit,needs_clarification,note) VALUES
('acquiring_pct','Эквайринг',3.19,NULL,NULL,'%',false,'от аванса'),
('insurance_pct','Страховые взносы',30,NULL,NULL,'%',false,'от ФОТ наёмных'),
('vacation_reserve_pct','Резерв отпускных',12.5,NULL,NULL,'%',false,'1/8 от ФОТ наёмных'),
('tax_usn_pct','УСН доходы',6,NULL,NULL,'%',false,''),
('tax_regime_default','Налоговый режим по умолчанию',NULL,'usn',NULL,'text',false,'usn / patent'),
('patent_cost_year','Стоимость патента в год',78300,NULL,NULL,'rub',false,''),
('patent_payment_schedule','График оплаты патента',NULL,'1/3 до 31.03; 2/3 до 31.12',NULL,'text',true,'Уточнить даты и доли'),
('fixed_self_contributions_2026','Фикс. взносы ИП за себя, 2026',57390,NULL,NULL,'rub',true,'Предварительно 57 390 ₽ (ст.430 НК РФ) + 1% с дохода свыше 300 тыс. — подтвердить'),
('payout_pct_default','Выплата собственнику',10,NULL,NULL,'%',false,'от поступлений'),
('credit_total','Кредит, сумма',910000,NULL,NULL,'rub',false,''),
('credit_interest_monthly','Кредит, проценты в мес',18109,NULL,NULL,'rub',false,''),
('credit_body_6m','Тело кредита, вариант 6 мес',151667,NULL,NULL,'rub',false,''),
('credit_body_12m','Тело кредита, вариант 12 мес',75900,NULL,NULL,'rub',false,''),
('credit_term_default','Вариант погашения по умолчанию',6,NULL,NULL,'month',false,'6 или 12'),
('credit_start_month','Старт выплат кредита',NULL,'2026-10',NULL,'month',false,''),
('credit_penalty_risk','Риск штрафа (за 7 дней)',10090,NULL,NULL,'rub',false,'Не в модели, справочно'),
('start_balance_tbank','Стартовый остаток Т-Банк',990404.78,NULL,NULL,'rub',false,''),
('start_balance_lokobank','Стартовый остаток Локо-Банк',109800,NULL,NULL,'rub',false,''),
('start_balance_total','Стартовый остаток итого',1100204.78,NULL,NULL,'rub',false,'= Т-Банк + Локо-Банк'),
('start_balance_date','Дата стартового остатка',NULL,NULL,'2026-10-01','date',false,''),
('ano_one_time_total','АНО разовые, итого',35500,NULL,NULL,'rub',false,'17 750 ₽ × 2 (сен, окт 2026)'),
('ano_monthly','АНО ежемесячно',5000,NULL,NULL,'rub',false,''),
('ano_start_monthly','АНО ежемесячно с',NULL,'2026-11',NULL,'month',false,'')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_months (
    id VARCHAR(7) PRIMARY KEY,
    year SMALLINT NOT NULL,
    month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12)
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_months (id, year, month)
SELECT to_char(d,'YYYY-MM'), EXTRACT(YEAR FROM d)::smallint, EXTRACT(MONTH FROM d)::smallint
FROM generate_series('2025-09-01'::date, '2027-12-01'::date, interval '1 month') d
ON CONFLICT (id) DO NOTHING;

CREATE TABLE t_p93118852_lineaschool_initiati.fm_metric_sources (
    metric_key VARCHAR(48) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    source_type VARCHAR(16) NOT NULL CHECK (source_type IN ('report','api')),
    report_name VARCHAR(255) NOT NULL,
    endpoint VARCHAR(64) NOT NULL,
    request VARCHAR(255) NOT NULL,
    field_path VARCHAR(255) NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('connected','to_connect')),
    used_in VARCHAR(255) NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT ''
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_metric_sources VALUES
('avans','Авансовые доходы','report','Отчёты → Авансовые доходы','payment-report','?month={month}&type=all','stats.total_revenue','connected','Доходы, эквайринг, налог',''),
('fact','Фактические доходы','report','Отчёты → Фактические доходы','fact-income','?month={month}','totals[month].total','connected','ФОТ педагогов, P&L','кэш fact_income_cache'),
('margin_pct','Средняя маржинальность за месяц','report','Отчёты → Маржинальность урока','unit-margin','?action=reports','unit_margin_reports(period_month={month}) → calcMonthTotals().marginPercent','connected','P&L','Средневзвешенная по сохранённому отчёту месяца'),
('avg_group_fill','Средняя наполняемость групп','report','Отчёты → Маржинальность урока','unit-margin','?action=fact&month={month}','group.avg_group_size','connected','Прогноз факта',''),
('avg_lessons_per_student','Среднее кол-во уроков на ученика','report','Отчёты → Маржинальность урока','unit-margin','?action=fact&month={month}','(individual.units+group.units)/students','to_connect','Прогноз факта','Готового поля в отчёте нет — вывести в отчёт'),
('active_students','Активные ученики','api','AlfaCRM → Динамика учеников','student-dynamics','student_count_weekly','active_count на последнюю неделю месяца','connected','Прогноз авансов','Еженедельные срезы из CRM'),
('attendance','Посещаемость','api','AlfaCRM → Маржинальность урока','unit-margin','?action=fact&month={month}','attended_units / units','connected','Прогноз факта',''),
('leaders_trends','Лидеры и тенденции','api','AlfaCRM','—','—','—','to_connect','Адаптивное прогнозирование','Подключить: в админке пока нет'),
('admin_shifts','Смены админов','report','Сотрудники → График работы админов','admin-shifts','admin_shifts','COUNT(*) WHERE kind=''work'' за месяц','connected','ФОТ админов','Ручной ввод только как override');

CREATE TABLE t_p93118852_lineaschool_initiati.fm_monthly_forecast (
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    metric_key VARCHAR(48) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_metric_sources(metric_key),
    value NUMERIC(14,2) NULL,
    method VARCHAR(64) NOT NULL DEFAULT '',
    computed_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (month_id, metric_key)
);

CREATE TABLE t_p93118852_lineaschool_initiati.fm_monthly_inputs (
    month_id VARCHAR(7) PRIMARY KEY REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    designer_earnings NUMERIC(14,2) NULL,
    admin_shifts_override INTEGER NULL,
    admin_kpi_active BOOLEAN NOT NULL DEFAULT false,
    payout_pct_override NUMERIC(7,4) NULL,
    tax_regime_override VARCHAR(8) NULL CHECK (tax_regime_override IN ('usn','patent')),
    credit_term_override SMALLINT NULL CHECK (credit_term_override IN (6,12)),
    note TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE t_p93118852_lineaschool_initiati.fm_staff (
    id VARCHAR(48) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(24) NOT NULL CHECK (role IN ('teacher','ruo','admin','accountant','targetologist','developer','designer')),
    type VARCHAR(16) NOT NULL CHECK (type IN ('hired','self_employed','contractor','informal')),
    staff_ref_id INTEGER NULL,
    crm_teacher_id INTEGER NULL,
    rate_source VARCHAR(16) NOT NULL DEFAULT 'manual' CHECK (rate_source IN ('teacher_rates','manual')),
    rate NUMERIC(14,2) NULL,
    rate_unit VARCHAR(16) NULL CHECK (rate_unit IN ('rub_lesson','rub_shift','rub_slide','rub_month')),
    rate_max NUMERIC(14,2) NULL,
    bonus_pct NUMERIC(7,4) NULL,
    bonus_base VARCHAR(16) NULL,
    substitution_rate NUMERIC(14,2) NULL,
    ndfl_applies BOOLEAN NOT NULL DEFAULT false,
    insurance_applies BOOLEAN NOT NULL DEFAULT false,
    vacation_applies BOOLEAN NOT NULL DEFAULT false,
    start_date DATE NULL,
    end_date DATE NULL
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_staff (id,name,role,type,staff_ref_id,crm_teacher_id,rate_source,rate,rate_unit,rate_max,bonus_pct,bonus_base,substitution_rate,ndfl_applies,insurance_applies,vacation_applies) VALUES
('kankulova','Екатерина Канкулова','teacher','self_employed',10,17,'teacher_rates',NULL,'rub_lesson',NULL,NULL,NULL,NULL,false,false,false),
('shishaeva','Анастасия Шишаева','teacher','hired',6,2,'teacher_rates',NULL,'rub_lesson',NULL,NULL,NULL,NULL,true,true,true),
('karamova','Анна Карамова','teacher','hired',7,18,'teacher_rates',NULL,'rub_lesson',NULL,NULL,NULL,NULL,true,true,true),
('kamneva','Валерия Камнева','teacher','hired',8,11,'teacher_rates',NULL,'rub_lesson',NULL,NULL,NULL,NULL,true,true,true),
('eremina','Дарья Еремина','teacher','hired',9,4,'teacher_rates',NULL,'rub_lesson',NULL,NULL,NULL,NULL,true,true,true),
('matsvey','Екатерина Мацвей','teacher','hired',11,15,'teacher_rates',NULL,'rub_lesson',NULL,NULL,NULL,NULL,true,true,true),
('ruo_zinchenko','Зинченко Ирина (РУО)','ruo','hired',4,13,'manual',60000,'rub_month',NULL,0.5,'avans',650,true,true,true),
('admin_fedorova','Федорова Анастасия','admin','hired',12,NULL,'manual',700,'rub_shift',1700,NULL,NULL,NULL,true,true,true),
('admin_khorunzheva','Хорунжева Анна','admin','hired',14,NULL,'manual',700,'rub_shift',1700,NULL,NULL,NULL,true,true,true),
('accountant','Бухгалтер','accountant','informal',NULL,NULL,'manual',15000,'rub_month',NULL,NULL,NULL,NULL,false,false,false),
('targetologist','Директолог','targetologist','contractor',NULL,NULL,'manual',10000,'rub_month',NULL,NULL,NULL,NULL,false,false,false),
('developer','Разработчик','developer','contractor',NULL,NULL,'manual',50000,'rub_month',NULL,NULL,NULL,NULL,false,false,false),
('designers','Дизайнеры','designer','self_employed',NULL,NULL,'manual',250,'rub_slide',NULL,NULL,NULL,NULL,false,false,false);

CREATE TABLE t_p93118852_lineaschool_initiati.fm_staff_monthly (
    staff_id VARCHAR(48) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_staff(id),
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    type_override VARCHAR(16) NULL CHECK (type_override IN ('hired','self_employed','contractor','informal')),
    rate_override NUMERIC(14,2) NULL,
    earnings NUMERIC(14,2) NULL,
    insurance_applies BOOLEAN NULL,
    vacation_applies BOOLEAN NULL,
    note TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (staff_id, month_id)
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_staff_monthly (staff_id,month_id,type_override,insurance_applies,vacation_applies,note) VALUES
('kankulova','2026-09','hired',true,true,'Сентябрь — по найму'),
('kankulova','2026-10','self_employed',false,false,'С октября — самозанятая');

CREATE TABLE t_p93118852_lineaschool_initiati.fm_expense_items (
    id VARCHAR(48) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(16) NOT NULL CHECK (category IN ('fixed','variable')),
    input_mode VARCHAR(16) NOT NULL CHECK (input_mode IN ('fixed','formula','manual')),
    amount NUMERIC(14,2) NULL,
    amount_unit VARCHAR(16) NOT NULL CHECK (amount_unit IN ('rub_month','rub_year','pct')),
    pct_const VARCHAR(64) NULL REFERENCES t_p93118852_lineaschool_initiati.fm_constants(key),
    pct_base VARCHAR(32) NULL,
    staff_id VARCHAR(48) NULL REFERENCES t_p93118852_lineaschool_initiati.fm_staff(id),
    sort SMALLINT NOT NULL DEFAULT 0
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_expense_items (id,name,category,input_mode,amount,amount_unit,pct_const,pct_base,staff_id,sort) VALUES
('ruo_salary','РУО (оклад)','fixed','fixed',60000,'rub_month',NULL,NULL,'ruo_zinchenko',10),
('accountant','Бухгалтер','fixed','fixed',15000,'rub_month',NULL,NULL,'accountant',20),
('targetologist','Директолог','fixed','fixed',10000,'rub_month',NULL,NULL,'targetologist',30),
('developer','Разработчик','fixed','fixed',50000,'rub_month',NULL,NULL,'developer',40),
('advertising','Реклама','fixed','manual',75000,'rub_month',NULL,NULL,NULL,50),
('neural_fixed','Нейронка (фикс)','fixed','fixed',10000,'rub_month',NULL,NULL,NULL,60),
('neural_irregular','Нейронка нерегуляр','fixed','manual',NULL,'rub_month',NULL,NULL,NULL,65),
('firstvds','Сервера FirstVDS','fixed','fixed',3000,'rub_month',NULL,NULL,NULL,70),
('kassa','Касса','fixed','fixed',16200,'rub_year',NULL,NULL,NULL,80),
('alfacrm','AlfaCRM','fixed','fixed',24960,'rub_year',NULL,NULL,NULL,90),
('wordwall','WordWall','fixed','fixed',9690,'rub_year',NULL,NULL,NULL,100),
('zoom','Zoom','fixed','fixed',17720,'rub_year',NULL,NULL,NULL,110),
('zup','ЗУП','fixed','fixed',8000,'rub_year',NULL,NULL,NULL,120),
('diadoc','Диадок','fixed','fixed',9300,'rub_year',NULL,NULL,NULL,130),
('fot_teachers','ФОТ педагогов','variable','formula',NULL,'pct',NULL,'fact',NULL,200),
('insurance','Страховые','variable','formula',NULL,'pct','insurance_pct','fot_hired',NULL,210),
('vacation','Отпускные','variable','formula',NULL,'pct','vacation_reserve_pct','fot_hired',NULL,220),
('acquiring','Эквайринг','variable','formula',NULL,'pct','acquiring_pct','avans',NULL,230);

CREATE TABLE t_p93118852_lineaschool_initiati.fm_expense_monthly (
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    expense_id VARCHAR(48) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_expense_items(id),
    amount NUMERIC(14,2) NOT NULL,
    override BOOLEAN NOT NULL DEFAULT true,
    note TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (month_id, expense_id)
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_expense_monthly (month_id,expense_id,amount) VALUES
('2026-09','neural_irregular',37500),('2026-10','neural_irregular',25000),('2026-11','neural_irregular',30000),
('2026-09','advertising',30000),('2026-10','advertising',75000),('2026-11','advertising',75000);

CREATE TABLE t_p93118852_lineaschool_initiati.fm_taxes (
    month_id VARCHAR(7) PRIMARY KEY REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    regime VARCHAR(8) NOT NULL CHECK (regime IN ('usn','patent')),
    base NUMERIC(14,2) NULL,
    rate NUMERIC(14,4) NULL,
    social_fund NUMERIC(14,2) NULL,
    tax_amount NUMERIC(14,2) NULL,
    computed_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE t_p93118852_lineaschool_initiati.fm_payouts (
    month_id VARCHAR(7) PRIMARY KEY REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    payout_pct NUMERIC(7,4) NOT NULL,
    payout_amount NUMERIC(14,2) NULL,
    computed_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE t_p93118852_lineaschool_initiati.fm_credit (
    month_id VARCHAR(7) PRIMARY KEY REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    interest NUMERIC(14,2) NOT NULL DEFAULT 0,
    body NUMERIC(14,2) NOT NULL DEFAULT 0,
    status VARCHAR(8) NOT NULL CHECK (status IN ('active','closed')),
    penalty_risk NUMERIC(14,2) NULL
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_credit (month_id,interest,body,status)
SELECT id,
       CASE WHEN id BETWEEN '2026-10' AND '2027-03' THEN 18109 ELSE 0 END,
       CASE WHEN id BETWEEN '2026-10' AND '2027-03' THEN 151667 ELSE 0 END,
       CASE WHEN id BETWEEN '2026-10' AND '2027-03' THEN 'active' ELSE 'closed' END
FROM t_p93118852_lineaschool_initiati.fm_months WHERE id >= '2026-10';

CREATE TABLE t_p93118852_lineaschool_initiati.fm_ano (
    month_id VARCHAR(7) PRIMARY KEY REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    one_time NUMERIC(14,2) NOT NULL DEFAULT 0,
    monthly NUMERIC(14,2) NOT NULL DEFAULT 0
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_ano (month_id,one_time,monthly)
SELECT id,
       CASE WHEN id IN ('2026-09','2026-10') THEN 17750 ELSE 0 END,
       CASE WHEN id >= '2026-11' THEN 5000 ELSE 0 END
FROM t_p93118852_lineaschool_initiati.fm_months WHERE id >= '2026-09';