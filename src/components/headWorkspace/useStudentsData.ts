import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StudentRow,
  StatusFilter,
  matchesFilter,
  fetchStudents,
  saveStudentOverride,
} from '@/lib/studentsApi';

export const useStudentsData = () => {
  const [items, setItems] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all_active');
  const [tariffFilter, setTariffFilter] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback((force = false) => {
    setLoading(true);
    setError('');
    return fetchStudents(force)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Принудительно перечитать данные из CRM, минуя кеш
  const refresh = useCallback(() => load(true), [load]);

  const tariffOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.tariff?.name) set.add(i.tariff.name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [items]);

  const toggleTariff = (name: string) =>
    setTariffFilter((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );

  const handleSaveConclusion = async (id: number, value: string) => {
    await saveStudentOverride(id, { conclusion: value });
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, conclusion: value.trim(), conclusion_manual: true } : it,
      ),
    );
  };

  // Город правится вручную, когда анкеты нет. Часовой пояс приходит
  // вместе с выбранным населённым пунктом и уходит в примечание CRM.
  const handleSaveCity = async (
    student: StudentRow,
    city: string,
    region: string,
    timezone: string,
  ) => {
    await saveStudentOverride(student.id, {
      city,
      city_region: region,
      city_timezone: timezone,
      crm_customer_id: student.crm_customer_id,
    });
    setItems((prev) =>
      prev.map((it) =>
        it.id === student.id
          ? {
              ...it,
              city,
              city_region: region,
              city_timezone: timezone,
              city_manual: city !== '',
            }
          : it,
      ),
    );
  };

  const handleSaveAge = async (id: number, age: number | null) => {
    await saveStudentOverride(id, { age });
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, age, age_manual: age != null } : it)),
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (!matchesFilter(i.status_id, filter)) return false;
      if (tariffFilter.length && !(i.tariff && tariffFilter.includes(i.tariff.name)))
        return false;
      if (q && !(i.name || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, tariffFilter, search]);

  const vacationsRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (i.status_id !== 4 && i.status_id !== 5) return false;
      if (q && !(i.name || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search]);

  const vacationsNoDate = useMemo(
    () => vacationsRows.filter((i) => !i.vacation?.date_to).length,
    [vacationsRows],
  );

  return {
    items,
    loading,
    error,
    refresh,
    filter,
    setFilter,
    tariffFilter,
    setTariffFilter,
    toggleTariff,
    tariffOptions,
    search,
    setSearch,
    handleSaveConclusion,
    handleSaveAge,
    handleSaveCity,
    filtered,
    vacationsRows,
    vacationsNoDate,
  };
};