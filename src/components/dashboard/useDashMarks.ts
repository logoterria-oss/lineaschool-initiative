import { useCallback, useEffect, useState } from 'react';
import { fetchDashMarks, saveDashMark } from '@/lib/adminShiftsApi';
import { CHECKLIST_EVENT, MarkState } from '@/components/adminShifts/useShiftChecklist';

/** Общие отметки дашборда: одни на всех руководителей и админов, обновляются раз в 30 секунд */
export function useDashMarks(date: string) {
  const [marks, setMarks] = useState<Record<string, MarkState>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const list = await fetchDashMarks(date);
    if (list) {
      const map: Record<string, MarkState> = {};
      list.forEach((m) => {
        map[m.item_key] = { done: !!m.done, comment: m.comment || '', by: m.done_by, at: m.at };
      });
      setMarks(map);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 30000);
    window.addEventListener('focus', load);
    return () => {
      window.clearInterval(t);
      window.removeEventListener('focus', load);
    };
  }, [load]);

  const setMark = useCallback(
    async (key: string, p: MarkState) => {
      setMarks((prev) => ({ ...prev, [key]: { ...p, by: prev[key]?.by } }));
      const by = await saveDashMark({ date, item_key: key, done: p.done, comment: p.comment });
      const now = new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Moscow',
      });
      setMarks((prev) => ({ ...prev, [key]: { ...p, by, at: p.done ? now : '' } }));
      window.dispatchEvent(new CustomEvent(CHECKLIST_EVENT));
    },
    [date],
  );

  return { marks, loading, setMark, reload: load };
}
