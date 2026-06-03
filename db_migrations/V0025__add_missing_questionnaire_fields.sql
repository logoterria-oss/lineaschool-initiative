ALTER TABLE t_p93118852_lineaschool_initiati.parent_questionnaire
  ADD COLUMN IF NOT EXISTS early_development text NULL,
  ADD COLUMN IF NOT EXISTS speech_therapist_current boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS neuropsychologist_current boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS defectologist_current boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS other_specialist_name text NULL,
  ADD COLUMN IF NOT EXISTS other_specialist_current boolean NULL DEFAULT false;
