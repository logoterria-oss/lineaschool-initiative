import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  AdminShift,
  OnShiftAdmin,
  fetchMyShift,
  fetchOnShiftNow,
  fetchShifts,
  markMyShift,
  moscowToday,
  shiftTime,
  MyShiftState,
} from '@/lib/adminShiftsApi';
import { notifyShiftChange, sendShiftReport } from '@/lib/interactionsApi';
import { notifyShiftChanged } from '@/components/interaction/useOnShiftAdmins';
import { useShiftChecklist, CHECKLIST_EVENT } from './useShiftChecklist';
import CloseShiftDialog from './CloseShiftDialog';
import TakeOverShiftDialog from './TakeOverShiftDialog';

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
  const [takeOver, setTakeOver] = useState<{ current: OnShiftAdmin[]; schedule: AdminShift[] } | null>(
    null,
  );
  const dayRef = useRef(moscowToday());
  const { items, headTasks, marks, doneCount, total, reload } = useShiftChecklist();

  const load = useCallback(async () => {
    setState(await fetchMyShift());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* Смена живёт в пределах московских суток. В полночь по Москве
     перечитываем состояние: незакрытая смена считается закрытой,
     и кнопка снова становится «На смене» для нового дня. */
  useEffect(() => {
    // Раз в минуту сверяем состояние: смену могли принять у этого сотрудника
    const id = setInterval(() => {
      dayRef.current = moscowToday();
      load();
    }, 60_000);
    return () => clearInterval(id);
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

  const doMark = async (act: 'start' | 'finish', reason = '', take = false) => {
    setBusy(true);
    const next = await markMyShift(act, take);
    setBusy(false);
    if (!next) {
      // Смену могли забрать, пока страница была открыта — показываем актуальное
      const fresh = await fetchMyShift();
      if (fresh) setState(fresh);
      toast({
        title: fresh?.finished_at ? 'Смена уже закрыта' : 'Не удалось отметить смену',
        description: fresh?.finished_at
          ? 'Вашу смену принял другой сотрудник'
          : undefined,
        variant: 'destructive',
      });
      return;
    }
    setState(next);
    notifyShiftChange(act);
    notifyShiftChanged();

    if (act === 'finish') {
      const report = buildReport();
      if (reason) report.push({ title: 'Причина невыполненных задач', done: false, comment: reason });
      sendShiftReport({
        // День смены присылает сервер (по Москве), а не часы на ПК
        date: next.date || today(),
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

  /** Перед открытием смотрим, не занята ли смена кем-то ещё */
  const startShift = async () => {
    setBusy(true);
    const day = moscowToday();
    const [onShift, month] = await Promise.all([fetchOnShiftNow(), fetchShifts(day.slice(0, 7))]);
    setBusy(false);
    const others = onShift.filter((a) => a.staff_id !== state?.staff_id);
    if (others.length === 0) {
      doMark('start');
      return;
    }
    setTakeOver({
      current: others,
      schedule: month.shifts.filter((x) => x.shift_date.slice(0, 10) === day),
    });
  };

  const press = () => {
    if (busy || finished) return;
    if (!started) {
      startShift();
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

      {takeOver && (
        <TakeOverShiftDialog
          current={takeOver.current}
          schedule={takeOver.schedule}
          myId={state?.staff_id}
          busy={busy}
          onCancel={() => setTakeOver(null)}
          onConfirm={() => {
            setTakeOver(null);
            doMark('start', '', true);
          }}
        />
      )}
    </>
  );
};

export default ShiftToggleButton;