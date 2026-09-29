-- Кэш маржинальности теперь хранит не только факт месяца ('2026-08'),
-- но и план по запланированным урокам ('plan:2026-08:3' — опорный месяц
-- и горизонт). VARCHAR(7) под такой ключ не подходит.
ALTER TABLE t_p93118852_lineaschool_initiati.margin_unit_cache
    ALTER COLUMN month TYPE VARCHAR(40);

COMMENT ON COLUMN t_p93118852_lineaschool_initiati.margin_unit_cache.month IS
  'Ключ среза: YYYY-MM для факта месяца либо plan:YYYY-MM:N для плана вперёд';
