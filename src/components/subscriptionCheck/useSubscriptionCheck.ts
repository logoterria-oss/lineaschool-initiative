import { useCallback, useEffect, useRef, useState } from 'react';
import { checkBatch, CheckRow, loadStudents } from './subscriptionCheckApi';

const BATCH = 4;
const PARALLEL = 2;
const ATTEMPTS = 3;

/**
 * Загружает учеников, затем пачками проверяет в CRM абонементы и списания —
 * только тех, кого сейчас видно (выбранные статусы). При смене фильтра
 * дозапрашиваются недостающие.
 */
export function useSubscriptionCheck(isVisible: (r: CheckRow) => boolean) {
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const run = useRef(0);
  const queued = useRef(new Set<number>());
  const queue = useRef<CheckRow[]>([]);
  const workers = useRef(0);
  const tariffs = useRef<unknown[]>([]);
  const refresh = useRef(false);

  const pump = useCallback(() => {
    const id = run.current;
    const worker = async () => {
      workers.current++;
      while (queue.current.length && id === run.current) {
        let part = queue.current.splice(0, BATCH);
        const size = part.length;
        for (let a = 0; a < ATTEMPTS && part.length; a++) {
          try {
            const res = await checkBatch(part, tariffs.current, refresh.current);
            if (id !== run.current) break;
            const byId = new Map(res.filter((r) => r.checked).map((r) => [r.customerId, r]));
            setRows((prev) => prev.map((r) => byId.get(r.customerId) ?? r));
            part = res.filter((r) => !r.checked);
          } catch {
            await new Promise((ok) => setTimeout(ok, 1500));
          }
        }
        if (id === run.current) setProgress((p) => ({ ...p, done: p.done + size }));
      }
      workers.current--;
    };
    while (workers.current < PARALLEL && queue.current.length) worker();
  }, []);

  const enqueue = useCallback(
    (list: CheckRow[]) => {
      const fresh = list.filter((r) => !r.checked && !queued.current.has(r.customerId));
      if (!fresh.length) return;
      fresh.forEach((r) => queued.current.add(r.customerId));
      queue.current.push(...fresh);
      setProgress((p) => ({ done: p.done, total: p.total + fresh.length }));
      pump();
    },
    [pump],
  );

  const start = useCallback(async (force = false) => {
    const id = ++run.current;
    refresh.current = force;
    queued.current = new Set();
    queue.current = [];
    workers.current = 0;
    setProgress({ done: 0, total: 0 });
    setLoading(true);
    setError('');
    try {
      const base = await loadStudents();
      if (id !== run.current) return;
      tariffs.current = base.tariffs;
      setRows(base.rows);
      setLoading(false);
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

  useEffect(() => {
    if (!loading && rows.length) enqueue(rows.filter(isVisible));
  }, [rows, loading, isVisible, enqueue]);

  return { rows, loading, error, progress, reload: () => start(true) };
}
