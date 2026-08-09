-- Добивка после V0123: «Томская обл» содержит подстроку «омская»,
-- поэтому Томск получал часовой пояс Омска (МСК+3 вместо МСК+4).
-- Та же ловушка у Ямало-Ненецкого АО (ловился как Ненецкий АО).
UPDATE t_p93118852_lineaschool_initiati.parent_questionnaire
SET city_timezone = 'МСК+4'
WHERE lower(city_region) LIKE '%томская%';

UPDATE t_p93118852_lineaschool_initiati.parent_questionnaire
SET city_timezone = 'МСК+2'
WHERE lower(city_region) LIKE '%ямало-ненецкий%';