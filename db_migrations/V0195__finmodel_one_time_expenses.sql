CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_one_time_categories (
    id VARCHAR(16) PRIMARY KEY,
    label VARCHAR(64) NOT NULL,
    sort SMALLINT NOT NULL DEFAULT 0
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_one_time_categories (id,label,sort) VALUES
('equipment','Оборудование',10),('software','ПО',20),('legal','Юруслуги',30),
('marketing','Маркетинг',40),('training','Обучение',50),('other','Прочее',60)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_one_time_expenses (
    id SERIAL PRIMARY KEY,
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    category VARCHAR(16) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_one_time_categories(id),
    comment TEXT NOT NULL DEFAULT '',
    source VARCHAR(16) NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fm_one_time_expenses_month_idx ON t_p93118852_lineaschool_initiati.fm_one_time_expenses(month_id);

INSERT INTO t_p93118852_lineaschool_initiati.fm_one_time_expenses (month_id,name,amount,category,comment) VALUES
('2026-01','Дизайнер',2300,'other','История'),
('2026-02','Страховые (разово)',14348,'other','История; постоянные расходы в модели считаются с сен 2026 — не дублируется'),
('2026-03','Прочее',20882,'other','История'),
('2026-04','Прочее',2688,'other','История'),
('2026-06','Прочее',75550,'other','История'),
('2026-07','Телефон разработчику',6000,'equipment','История'),
('2026-07','ПО бухгалтеру',8000,'software','История'),
('2026-07','hh.ru',2852,'marketing','История'),
('2026-07','Ноутбук',18200,'equipment','История'),
('2026-08','Прочее',37768,'other','История');