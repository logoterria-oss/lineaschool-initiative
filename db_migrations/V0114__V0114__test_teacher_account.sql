INSERT INTO t_p93118852_lineaschool_initiati.staff
  (full_name, phone, password_hash, role, status, email, email_verified, job_title)
VALUES
  ('Камнева Валерия', '79000000002',
   '98e0c843a6a424883aee3f0d69d00f48$1fe52b58b4f01b811cad8c6c4565e6de6c758e17a5823daefc7cf5af1cde01ee',
   'teacher', 'active', 'test-teacher@lineaschool.ru', true, 'Педагог (тест)')
ON CONFLICT (phone) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  email = EXCLUDED.email,
  email_verified = EXCLUDED.email_verified,
  job_title = EXCLUDED.job_title,
  updated_at = now();