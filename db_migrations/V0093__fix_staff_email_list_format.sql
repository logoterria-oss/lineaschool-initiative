UPDATE staff
SET email = trim(both '''' from regexp_replace(email, '^\[''?|''?\]$', '', 'g'))
WHERE email LIKE '[%]';