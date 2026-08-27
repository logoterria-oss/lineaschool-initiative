import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChecklistMark,
  HeadTask,
  fetchChecklist,
  moscowToday,
  saveChecklistMark,
} from '@/lib/adminShiftsApi';
import { ChecklistBlock, ChecklistItem, checklistFor } from '@/lib/shiftChecklist';

export interface MarkState {
  done: boolean;
  comment: string;
}

/** Событие, чтобы кнопка смены знала об изменении чек-листа */
export const CHECKLIST_EVENT = 'shift-checklist-changed';

/** Чек-лист администратора на день: пункты, отметки и задачи руководителя */
export function useShiftChecklist(dateArg?: string) {
  const date = dateArg || moscowToday();
  const [marks, setMarks] = useState<Record<string, MarkState>>({});
  const [headTasks, setHeadTasks] = useState<HeadTask[]>([]);
  const [loading, setLoading] = useState(true);

  const items = useMemo(() => checklistFor(date), [date]);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchChecklist(date);
    const map: Record<string, MarkState> = {};
    (data.marks || []).forEach((m: ChecklistMark) => {
      map[m.item_key] = { done: !!m.done, comment: m.comment || '' };
    });
    setMarks(map);
    setHeadTasks(data.head_tasks || []);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const setMark = useCallback(
    async (key: string, p: MarkState) => {
      setMarks((prev) => ({ ...prev, [key]: p }));
      await saveChecklistMark({ date, item_key: key, done: p.done, comment: p.comment });
      window.dispatchEvent(new CustomEvent(CHECKLIST_EVENT));
    },
    [date],
  );

  const blocks = useMemo(() => {
    const order: ChecklistBlock[] = ['morning', 'day', 'evening', 'weekly'];
    return order
      .map((b) => [b, items.filter((i) => i.block === b)] as [ChecklistBlock, ChecklistItem[]])
      .filter(([, list]) => list.length > 0);
  }, [items]);

  const total = items.length + headTasks.length;
  const doneCount = useMemo(() => {
    const keys = [...items.map((i) => i.key), ...headTasks.map((t) => `head-${t.id}`)];
    return keys.filter((k) => marks[k]?.done).length;
  }, [items, headTasks, marks]);

  return { date, items, blocks, marks, headTasks, loading, total, doneCount, setMark, reload: load };
}
