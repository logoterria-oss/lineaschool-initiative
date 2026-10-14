import { useCallback, useEffect, useRef, useState } from 'react';
import { checkBatch, CheckRow, loadStudents } from './subscriptionCheckApi';

const BATCH = 4;
const PARALLEL = 2;
const ATTEMPTS = 3;

/**
 * Загружает всех занимающихся учеников, затем пачками проверяет
 * абонементы и списания в CRM — строки окрашиваются по мере проверки.
 */
export function useSubscriptionCheck() {
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const run = useRef(0);

  const start = useCallback(async (refresh = false) => {
    const id = ++run.current;
    setLoading(true);
    setError('');
    try {
      const base = await loadStudents();
      if (id !== run.current) return;
      setRows(base.rows);
      setLoading(false);

      const batches: CheckRow[][] = [];
      for (let i = 0; i < base.rows.length; i += BATCH) batches.push(base.rows.slice(i, i + BATCH));
      let done = 0;
      setProgress({ done: 0, total: base.rows.length });

      const worker = async () => {
        while (batches.length) {
          let part = batches.shift()!;
          const size = part.length;
          for (let a = 0; a < ATTEMPTS && part.length; a++) {
            try {
              const res = await checkBatch(part, base.tariffs, refresh);
              if (id !== run.current) return;
              const byId = new Map(res.filter((r) => r.checked).map((r) => [r.customerId, r]));
              setRows((prev) => prev.map((r) => byId.get(r.customerId) ?? r));
              part = res.filter((r) => !r.checked);
            } catch {
              await new Promise((ok) => setTimeout(ok, 1500));
            }
          }
          done += size;
          if (id === run.current) setProgress({ done, total: base.rows.length });
        }
      };
      await Promise.all(Array.from({ length: PARALLEL }, worker));
    } catch (e) {
      if (id === run.current) {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки');
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    start();
    return () => {
      run.current++;
    };
  }, [start]);

  return { rows, loading, error, progress, reload: () => start(true) };
}
