-- Согласие на рекламную рассылку (SMS, e-mail, мессенджеры, соцсети).
-- Даётся отдельно от согласия на обработку персональных данных и является
-- добровольным, поэтому храним выбор родителя явно. По умолчанию — отказ.
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN leads.marketing_consent IS
  'Родитель разрешил рекламные рассылки (SMS, e-mail, соцсети). FALSE — слать промо нельзя';
