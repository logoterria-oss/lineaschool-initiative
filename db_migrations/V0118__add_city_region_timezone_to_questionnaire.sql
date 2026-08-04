ALTER TABLE parent_questionnaire
  ADD COLUMN IF NOT EXISTS city_region VARCHAR(255),
  ADD COLUMN IF NOT EXISTS city_timezone VARCHAR(50);