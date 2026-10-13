import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { AdminShift, OnShiftAdmin, shiftTime } from '@/lib/adminShiftsApi';

interface Props {
  /** Кто сейчас на смене (кроме меня) */
  current: OnShiftAdmin[];
  /** График на сегодня */
  schedule: AdminShift[];
  myId?: number;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const firstName = (full: string) => {
  const parts = (full || '').trim().split(/\s+/);
  return parts.length > 1 ? parts[1] : parts[0];
};

const joinNames = (names: string[]) =>
  names.length < 2 ? names[0] || '' : `${names.slice(0, -1).join(', ')} и ${names[names.length - 1]}`;

/** Предупреждение, когда смену открывают, а кто-то другой ещё на смене */
const TakeOverShiftDialog = ({ current, schedule, myId, busy, onCancel, onConfirm }: Props) => {
  const names = current.map((a) => firstName(a.staff_name));
  const who = joinNames(names);
  const rows = schedule
    .filter((s) => s.kind === 'work')
    .sort((a, b) => (a.time_from || '').localeCompare(b.time_from || ''));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Icon name="ArrowLeftRight" size={20} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900">Сейчас на смене {who}</div>
            <div className="text-sm text-gray-600 mt-1">
              Если вы откроете смену, смена у {names.length > 1 ? 'них' : who} закроется, и чаты
              перейдут вам.
            </div>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3">
            <div className="text-xs font-medium text-gray-500 uppercase mb-2">График на сегодня</div>
            <div className="space-y-1.5">
              {rows.map((s) => {
                const mine = s.staff_id === myId;
                const now = current.some((a) => a.staff_id === s.staff_id);
                return (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="tabular-nums text-gray-500 w-[92px] shrink-0">
                      {s.time_from ? `${s.time_from}–${s.time_to}` : 'весь день'}
                    </span>
                    <span className={`truncate ${mine ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {s.staff_name}
                      {mine && <span className="text-gray-400 font-normal"> · вы</span>}
                    </span>
                    {now && (
                      <span className="ml-auto shrink-0 text-[11px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                        на смене с {shiftTime(current.find((a) => a.staff_id === s.staff_id)?.started_at || null)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-700 mt-4">Вы уверены, что принимаете смену у {who}?</div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl">
            Пока нет
          </Button>
          <Button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl"
          >
            Да, принимаю смену
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TakeOverShiftDialog;