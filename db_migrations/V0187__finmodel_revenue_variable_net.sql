-- Переменный % из отчёта «Маржинальность урока» уже включает эквайринг.
-- Эквайринг вычитается из поступлений, поэтому к факту применяем процент БЕЗ эквайринга.
ALTER TABLE t_p93118852_lineaschool_initiati.fm_revenue_monthly
    ADD COLUMN variable_pct_net NUMERIC(7,4) NULL;