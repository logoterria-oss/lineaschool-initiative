INSERT INTO t_p93118852_lineaschool_initiati.fm_constants (key, label, value_num, value_text, unit, note) VALUES
 ('tax_regime_global', 'Налоговый режим для прогноза (auto — УСН до перехода, затем патент)', NULL, 'auto', 'text', 'Переключатель дашборда; действует с текущего месяца'),
 ('credit_payment_day', 'День ежемесячного платежа по кредиту', 17, NULL, 'day', 'По договору от 17.09.2026 — уточнить'),
 ('notify_close_after_day', 'Уведомлять о незакрытом месяце с N-го числа', 3, NULL, 'day', ''),
 ('notify_variable_pp', 'Порог изменения переменного %, п.п.', 5, NULL, 'pp', '')
ON CONFLICT (key) DO NOTHING;