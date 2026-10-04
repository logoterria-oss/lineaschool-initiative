-- Выписки 1С, присланные банками на почту: журнал обработанных писем (чтобы не разбирать повторно).
CREATE TABLE t_p93118852_lineaschool_initiati.fm_bank_mail_log (
    message_id VARCHAR(300) PRIMARY KEY,
    sender VARCHAR(200) NOT NULL DEFAULT '',
    subject VARCHAR(300) NOT NULL DEFAULT '',
    received_at TIMESTAMP NULL,
    files INTEGER NOT NULL DEFAULT 0,
    inserted INTEGER NOT NULL DEFAULT 0,
    error TEXT NOT NULL DEFAULT '',
    processed_at TIMESTAMP NOT NULL DEFAULT now()
);
INSERT INTO t_p93118852_lineaschool_initiati.fm_constants (key, label, value_num, value_text, unit, note) VALUES
 ('bank_mail_senders', 'Банк: от кого брать выписки на почте (через запятую)', NULL, 'tbank.ru,tinkoff.ru,lockobank.ru', 'text', 'Домены или адреса отправителей'),
 ('bank_mail_checked_at', 'Банк: когда последний раз проверяли почту', NULL, NULL, 'text', '')
ON CONFLICT (key) DO NOTHING;