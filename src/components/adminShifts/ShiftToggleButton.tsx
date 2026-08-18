import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { fetchMyShift, markMyShift, shiftTime, MyShiftState } from '@/lib/adminShiftsApi';

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Кнопка отметки смены администратора.
 * Первое нажатие — «На смене», второе — «Смена закончена».
 * Обе отметки попадают в график работы админов вместе со временем.
 */
const ShiftToggleButton = () => {
  const { toast } = useToast();
  const [state, setState] = useState<MyShiftState | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState(await fetchMyShift(today()));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const started = !!state?.started_at;
  const finished = !!state?.finished_at;

  const press = async () => {
    if (busy || finished) return;
    setBusy(true);
    const next = await markMyShift(today(), started ? 'finish' : 'start');
    setBusy(false);
    if (!next) {
      toast({ title: 'Не удалось отметить смену', variant: 'destructive' });
      return;
    }
    setState(next);
    toast({
      title: started ? 'Смена закрыта' : 'Смена открыта',
      description: started
        ? `Отметка ${shiftTime(next.finished_at)} — записана в график`
        : `Отметка ${shiftTime(next.started_at)} — записана в график`,
    });
  };

  const label = finished ? 'Смена завершена' : started ? 'Смена закончена' : 'На смене';
  const icon = finished ? 'CheckCheck' : started ? 'LogOut' : 'Play';
  const cls = finished
    ? 'bg-gray-100 text-gray-500 cursor-default'
    : started
      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
      : 'bg-green-50 text-green-700 hover:bg-green-100';

  return (
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
  );
};

export default ShiftToggleButton;
