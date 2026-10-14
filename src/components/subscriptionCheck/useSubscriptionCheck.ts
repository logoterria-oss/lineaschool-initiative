import { useCallback, useEffect, useRef, useState } from 'react';
import { checkBatch, CheckRow, loadPayments } from './subscriptionCheckApi';

const BATCH = 3;
const ATTEMPTS = 3;

/**
 * Загружает оплаты месяца, затем пачками проверяет абонементы в CRM.
 * CRM отвечает медленно, поэтому строки «доезжают» постепенно.
 */
export function useSubscriptionCheck(month: string) {
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const run = useRef(0);

  const start = useCallback(async () => {
    const id = ++run.current;
    setLoading(true);
    setError('');
    setRows([]);
    try {
      const base = await loadPayments(month);
      if (id !== run.current) return;
      setRows(base.rows);
      setLoading(false);

      const queue = base.rows.filter((r) => !r.checked && r.customerId);
      setProgress({ done: 0, total: queue.length });
      let done = 0;
      for (let i = 0; i < queue.length; i += BATCH) {
        let part = queue.slice(i, i + BATCH);
        for (let a = 0; a < ATTEMPTS && part.length; a++) {
          try {
            const res = await checkBatch(part, base.tariffs);
            if (id !== run.current) return;
            const byKey = new Map(res.map((r) => [r.key, r]));
            setRows((prev) => prev.map((r) => {
              const n = byKey.get(r.key);
              return n && n.checked ? n : r;
            }));
            part = res.filter((r) => !r.checked);
          } catch {
            await new Promise((ok) => setTimeout(ok, 1500));
          }
        }
        done += Math.min(BATCH, queue.length - i);
        setProgress({ done, total: queue.length });
      }
    } catch (e) {
      if (id === run.current) {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки');
        setLoading(false);
      }
    }
  }, [month]);

  useEffect(() => {
    start();
    return () => {
      run.current++;
    };
  }, [start]);

  return { rows, loading, error, progress, reload: start };
}
