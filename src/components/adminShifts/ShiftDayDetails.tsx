import Icon from '@/components/ui/icon';
import { AdminShift, ShiftTask, KIND_META, shiftTime } from '@/lib/adminShiftsApi';
import { formatMinutes } from '@/lib/workLogApi';

interface Props {
  date: string;
  shifts: AdminShift[];
  tasks: ShiftTask[];
  /** На мобильном показываем как окно, на ПК — как подсказку у ячейки */
  asModal?: boolean;
  onClose?: () => void;
}

const dayTitle = (date: string) =>
  new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

/** Что было в этот день: смены, отметки прихода-ухода и выполненные задачи */
const ShiftDayDetails = ({ date, shifts, tasks, asModal, onClose }: Props) => {
  const body = (
    <div className="space-y-3">
      <div className="font-semibold text-gray-900 text-sm first-letter:uppercase">
        {dayTitle(date)}
      </div>

      {shifts.length === 0 && <div className="text-xs text-gray-500">Смен в этот день нет</div>}

      {shifts.map((s) => {
        const own = tasks.filter((t) => t.staff_id === s.staff_id);
        const totalMinutes = own.reduce((sum, t) => sum + (t.minutes || 0), 0);
        return (
          <div key={s.id} className="border-t border-gray-100 pt-2 first:border-0 first:pt-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium text-gray-900">{s.staff_name}</span>
              <span
                className={`text-[10px] rounded-full border px-1.5 py-0.5 ${KIND_META[s.kind].cls}`}
              >
                {KIND_META[s.kind].label}
              </span>
            </div>

            <div className="mt-1 space-y-0.5 text-xs">
              <div
                className={`flex items-center gap-1.5 ${
                  s.started_at ? 'text-green-700' : 'text-gray-400'
                }`}
              >
                <Icon name={s.started_at ? 'CircleCheck' : 'Circle'} size={13} />
                {s.started_at ? `Открыл смену: ${shiftTime(s.started_at)}` : 'Смена не открыта'}
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  s.finished_at ? 'text-green-700' : 'text-gray-400'
                }`}
              >
                <Icon name={s.finished_at ? 'CircleCheck' : 'Circle'} size={13} />
                {s.finished_at ? `Закрыл смену: ${shiftTime(s.finished_at)}` : 'Смена не закрыта'}
              </div>
            </div>

            {own.length > 0 && (
              <div className="mt-2">
                <div className="text-[11px] text-gray-500 mb-1">
                  Задачи за день: {own.length}
                  {totalMinutes > 0 ? ` · ${formatMinutes(totalMinutes)}` : ''}
                </div>
                <ul className="space-y-0.5 max-h-52 overflow-auto pr-1">
                  {own.map((t, i) => (
                    <li key={`${t.task_code}-${i}`} className="flex items-start gap-1.5 text-xs">
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-600 rounded px-1 py-0.5 shrink-0 mt-0.5">
                        {t.task_code}
                      </span>
                      <span className="text-gray-700 leading-snug">
                        {t.task_title}
                        {t.subject ? ` — ${t.subject}` : ''}
                        {t.minutes > 0 ? ` · ${formatMinutes(t.minutes)}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {own.length === 0 && s.finished_at && (
              <div className="mt-1.5 text-[11px] text-gray-400">Задачи за день не записаны</div>
            )}
          </div>
        );
      })}
    </div>
  );

  if (!asModal) {
    return (
      <div className="w-72 bg-white rounded-xl border border-gray-200 shadow-xl p-3">{body}</div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">{body}</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0">
            <Icon name="X" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftDayDetails;
