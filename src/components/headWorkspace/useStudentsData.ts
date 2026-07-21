import { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchStudents()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

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
    filtered,
    vacationsRows,
    vacationsNoDate,
  };
};
