-- 1. Убрать фантомную оплату Кошевого (нет в эталоне бухгалтера)
UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET paid_at = NULL, transaction_id = NULL
WHERE id = 169 AND name ILIKE '%кошев%';

-- 2. Скокова: дата по эталону 14.02
UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET paid_at = '2026-02-14 12:00:00'
WHERE id = 581 AND name = 'Мира Скокова';

-- 3. Мукасьян (две диагностики): дата по эталону 23.02
UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET paid_at = '2026-02-23 12:00:00'
WHERE id IN (202, 203) AND name ILIKE '%мукасьян%';

-- 4. Имена плательщиков -> имена учеников (как в эталоне)
UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET name = 'Николай Костомнин' WHERE id = 167;
UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET name = 'Джамал Кегерманов' WHERE id = 191;
UPDATE t_p93118852_lineaschool_initiati.payment_leads
SET name = 'Ярослава Василевская' WHERE id = 211;