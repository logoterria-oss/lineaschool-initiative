INSERT INTO t_p93118852_lineaschool_initiati.fm_constants (key, label, value_num, unit, note) VALUES
('anchor_fade_months', 'За сколько месяцев затухает привязка к последнему факту', 3, 'мес', 'Поправка полная в первом прогнозном месяце и линейно сходит на нет; дальше — прошлый год × коэффициент роста')
ON CONFLICT (key) DO NOTHING;