import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  fetchMyShift,
  markMyShift,
  moscowToday,
  shiftTime,
  MyShiftState,
} from '@/lib/adminShiftsApi';
import { notifyShiftChange, sendShiftReport } from '@/lib/interactionsApi';
import { notifyShiftChanged } from '@/components/interaction/useOnShiftAdmins';
import { useShiftChecklist, CHECKLIST_EVENT } from './useShiftChecklist';
import CloseShiftDialog from './CloseShiftDialog';

const today = () => moscowToday();

/**
 * Кнопка отметки смены администратора.
 * Первое нажатие — «На смене», второе — «Смена закончена».
 * При закрытии смены заполненный чек-лист уходит руководителю.
 */
const ShiftToggleButton = ({ staffName }: { staffName?: string }) => {
  const { toast } = useToast();
  const [state, setState] = useState<MyShiftState | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const { items, headTasks, marks, doneCount, total, reload } = useShiftChecklist();

  const load = useCallback(async () => {
    setState(await fetchMyShift(today()));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const h = () => reload();
    window.addEventListener(CHECKLIST_EVENT, h);
    return () => window.removeEventListener(CHECKLIST_EVENT, h);
  }, [reload]);

  const started = !!state?.started_at;
  const finished = !!state?.finished_at;
  const undone = total - doneCount;

  /** Собираем чек-лист в отчёт для руководителя */
  const buildReport = () => [
    ...headTasks.map((t) => ({
      title: t.title,
      done: !!marks[`head-${t.id}`]?.done,
      comment: marks[`head-${t.id}`]?.comment || '',
      from_head: true,
    })),
    ...items.map((i) => ({
      title: i.title,
      done: !!marks[i.key]?.done,
      comment: marks[i.key]?.comment || '',
    })),
  ];

  const doMark = async (act: 'start' | 'finish', reason = '') => {
    setBusy(true);
    const next = await markMyShift(today(), act);
    setBusy(false);
    if (!next) {
      toast({ title: 'Не удалось отметить смену', variant: 'destructive' });
      return;
    }
    setState(next);
    notifyShiftChange(act);
    notifyShiftChanged();

    if (act === 'finish') {
      const report = buildReport();
      if (reason) report.push({ title: 'Причина невыполненных задач', done: false, comment: reason });
      sendShiftReport({
        date: today(),
        staff_name: staffName || '',
        started_at: next.started_at,
        finished_at: next.finished_at,
        done: doneCount,
        total,
        items: report,
      });
    }

    toast({
      title: act === 'finish' ? 'Смена закрыта' : 'Смена открыта',
      description:
        act === 'finish'
          ? `Отметка ${shiftTime(next.finished_at)} — чек-лист отправлен руководителю`
          : `Отметка ${shiftTime(next.started_at)} — окно взаимодействия оповещено`,
    });
  };

  const press = () => {
    if (busy || finished) return;
    if (!started) {
      doMark('start');
      return;
    }
    if (undone > 0) {
      setConfirm(true);
      return;
    }
    doMark('finish');
  };

  const label = finished ? 'Смена завершена' : started ? 'Смена закончена' : 'На смене';
  const icon = finished ? 'CheckCheck' : started ? 'LogOut' : 'Play';
  const cls = finished
    ? 'bg-gray-100 text-gray-500 cursor-default'
    : started
      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
      : 'bg-green-50 text-green-700 hover:bg-green-100';

  return (
    <>
      <button
        onClick={press}
        disabled={busy || finished}
        className={`mt-2 w-full flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg transition-colors ${cls}`}
      >
        {busy ? (
          <Icon name="Loader" size={16} className="animate-spin flex-shrink-0" />
        ) : (
          <Icon name={icon as 'Play'} size={16} className="flex-shrink-0" />
        )}
        <span>{label}</span>
        {(started || finished) && (
          <span className="text-[11px] opacity-70">
            {shiftTime(state?.started_at || null)}
            {finished ? `–${shiftTime(state?.finished_at || null)}` : ''}
          </span>
        )}
      </button>

      {confirm && (
        <CloseShiftDialog
          undone={undone}
          total={total}
          onCancel={() => setConfirm(false)}
          onConfirm={(reason) => {
            setConfirm(false);
            doMark('finish', reason);
          }}
        />
      )}
    </>
  );
};

export default ShiftToggleButton;
