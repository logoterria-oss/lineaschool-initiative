ALTER TABLE t_p93118852_lineaschool_initiati.parent_questionnaire
  ADD COLUMN IF NOT EXISTS prenatal_no_features boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_dev_no_features boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS neurological_none boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hearing_vision_none boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS chronic_none boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS speech_env_none boolean NULL DEFAULT false;
