UPDATE t_p93118852_lineaschool_initiati.fm_bank_rules SET category = 'revenue', label = 'Эквайринг: удержания (уменьшают поступления)' WHERE sort = 40 AND pattern = 'эквайринг';
INSERT INTO t_p93118852_lineaschool_initiati.fm_bank_rules (sort, direction, field, pattern, category, label) VALUES
 (13, 'in', 'account', '40817810300065693797', 'other', 'Пополнение с личного счёта собственника');
INSERT INTO t_p93118852_lineaschool_initiati.fm_constants (key, label, value_num, value_text, unit, note) VALUES
 ('bank_fact_from', 'Cash Flow: факт по банку с месяца', NULL, '2026-10', 'text', 'Раньше — ручной ввод итогов')
ON CONFLICT (key) DO NOTHING;