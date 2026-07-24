-- Импортированные из CRM, но не зарегистрированные сотрудники (без пароля)
-- ошибочно помечались как 'active'. Возвращаем им статус 'pending'.
UPDATE staff SET status = 'pending', updated_at = now()
WHERE password_hash = '' AND status = 'active';