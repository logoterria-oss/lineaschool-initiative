import { useEffect, useState } from 'react';
import { calcAge, formatStudentName, manualAge } from '@/components/schedule/types';

const S20_URL = 'https://functions.poehali.dev/6d9e6094-fd18-47ec-b45f-ad3ee4ba7cc2';

export interface StudentOption {
  id: number;
  name: string;
  age: number | null;
}

interface RawCustomer {
  id?: number;
  name?: string;
  dob?: string;
  removed?: number;
}

let cache: StudentOption[] | null = null;

export const useStudents = () => {
  const [students, setStudents] = useState<StudentOption[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cache) return;
    let alive = true;
    setLoading(true);
    fetch(`${S20_URL}?mode=customers`)
      .then((r) => r.json())
      .then((data) => {
        const raw: RawCustomer[] = Array.isArray(data.customers) ? data.customers : [];
        const list: StudentOption[] = raw
          .filter((c) => c && c.id != null && c.name)
          .map((c) => {
            const name = formatStudentName(c.name);
            const age = manualAge(name) ?? calcAge(c.dob);
            return { id: c.id as number, name, age };
          })
          .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        cache = list;
        if (alive) setStudents(list);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Ошибка загрузки учеников'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { students, loading, error };
};
