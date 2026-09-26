-- Все оплаты, проведённые ДО подключения «Окна взаимодействия», помечаем
-- как уже отправленные. Иначе при первом запросе feed окно получит
-- почти тысячу старых карточек и завалит ими диалоги.
UPDATE payment_leads
SET interaction_sent_at = CURRENT_TIMESTAMP
WHERE paid_at IS NOT NULL AND interaction_sent_at IS NULL;