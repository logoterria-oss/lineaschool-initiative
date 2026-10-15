ALTER TABLE t_p93118852_lineaschool_initiati.payment_leads ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE t_p93118852_lineaschool_initiati.payment_leads SET is_test = TRUE
WHERE concat_ws(' ', name, crm_name) ~ '(^|[^А-ЯЁа-яёA-Za-z0-9])([Тт][Ее][Сс][Тт]([Оо][Вв]([Ыы][Йй]|[Аа][Яя]|[Оо][Ее]|[Ыы][Ее]|[Ии][Чч])?)?|[Tt][Ee][Ss][Tt])([^А-ЯЁа-яёA-Za-z0-9]|$)';