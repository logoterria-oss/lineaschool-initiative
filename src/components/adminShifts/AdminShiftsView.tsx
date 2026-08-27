import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  AdminShift,
  ShiftAdmin,
  ShiftKind,
  ShiftTask,
  deleteShift,
  fetchShifts,
  moscowToday,
  saveShift,
} from '@/lib/adminShiftsApi';
import ShiftEditor from './ShiftEditor';
import ShiftDayDetails from './ShiftDayDetails';
import HoverPortal from './HoverPortal';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const shortName = (full: string) => {
  const parts = (full || '').trim().split(/\s+/);
  if (parts.length < 2) return full;
  return `${parts[0]} ${parts[1][0]}.`;
};

/** Сетка месяца: массив дат «YYYY-MM-DD» либо null для пустых клеток */
function monthGrid(month: string): (string | null)[] {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthTitle = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
};

/** График работы администраторов — календарь смен по датам */
const AdminShiftsView = () => {
  const { toast } = useToast();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [shifts, setShifts] = useState<AdminShift[]>([]);
  const [admins, setAdmins] = useState<ShiftAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ShiftTask[]>([]);
  // Держим и дату, и координаты ячейки — по ним подсказка выбирает, куда раскрыться
  const [hover, setHover] = useState<{ date: string; rect: DOMRect } | null>(null);
  const [tapDate, setTapDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchShifts(month);
    setShifts(data.shifts);
    setAdmins(data.admins);
    setTasks(data.tasks);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const byDate = useMemo(() => {
    const map: Record<string, AdminShift[]> = {};
    for (const s of shifts) {
      const key = s.shift_date.slice(0, 10);
      (map[key] ||= []).push(s);
    }
    return map;
  }, [shifts]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, ShiftTask[]> = {};
    for (const t of tasks) (map[t.log_date] ||= []).push(t);
    return map;
  }, [tasks]);

  const cells = useMemo(() => monthGrid(month), [month]);
  const today = moscowToday();

  const handleSave = async (p: {
    staff_id: number;
    date: string;
    time_from: string;
    time_to: string;
    kind: ShiftKind;
    note: string;
  }) => {
    const ok = await saveShift(p);
    if (!ok) {
      toast({ title: 'Не удалось сохранить', variant: 'destructive' });
      return;
    }
    toast({ title: 'Смена сохранена' });
    load();
  };

  const handleDelete = async (staffId: number, date: string) => {
    const ok = await deleteShift(staffId, date);
    if (!ok) {
      toast({ title: 'Не удалось убрать смену', variant: 'destructive' });
      return;
    }
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth(shiftMonth(month, -1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50"
          >
            <Icon name="ChevronLeft" size={18} />
          </button>
          <div className="min-w-[170px] text-center font-semibold text-gray-900 first-letter:uppercase">
            {monthTitle(month)}
          </div>
          <button
            onClick={() => setMonth(shiftMonth(month, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50"
          >
            <Icon name="ChevronRight" size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 ml-auto text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Icon name="Check" size={13} className="text-green-600" />
            смена открыта
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="Check" size={13} className="text-green-600" />
            <Icon name="Check" size={13} className="text-green-600 -ml-2" />
            смена закрыта
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-gray-50 text-center text-xs font-medium text-gray-500 py-2">
            {w}
          </div>
        ))}

        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="bg-gray-50 min-h-[92px]" />;
          const day = Number(date.slice(8, 10));
          const list = byDate[date] || [];
          const isToday = date === today;
          const marked = list.some((s) => s.started_at || s.finished_at);
          return (
            <div
              key={date}
              className={`relative bg-white min-h-[92px] ${
                isToday ? 'ring-2 ring-inset ring-green-400' : ''
              }`}
              onMouseEnter={(e) =>
                marked && setHover({ date, rect: e.currentTarget.getBoundingClientRect() })
              }
              onMouseLeave={() => setHover(null)}
            >
              <button
                onClick={() => setEditDate(date)}
                className="w-full h-full min-h-[92px] p-1.5 text-left align-top hover:bg-green-50/60 transition-colors"
              >
                <div
                  className={`text-xs mb-1 ${isToday ? 'font-bold text-green-700' : 'text-gray-400'}`}
                >
                  {day}
                </div>
                <div className="space-y-0.5">
                  {list.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-1 text-[11px] leading-tight rounded px-1 py-0.5 border bg-green-100 text-green-800 border-green-200"
                      title={s.staff_name}
                    >
                      <span className="truncate flex-1">{shortName(s.staff_name)}</span>
                      {(s.started_at || s.finished_at) && (
                        <span className="flex items-center shrink-0">
                          {s.started_at && <Icon name="Check" size={11} className="-mr-1" />}
                          {s.finished_at && <Icon name="Check" size={11} />}
                        </span>
                      )}
                    </div>
                  ))}
                  {list.length > 3 && (
                    <div className="text-[11px] text-gray-400 px-1">ещё {list.length - 3}</div>
                  )}
                </div>
              </button>

              {marked && (
                <button
                  onClick={() => setTapDate(date)}
                  title="Что было в этот день"
                  className="sm:hidden absolute top-1 right-1 text-gray-300 hover:text-gray-500"
                >
                  <Icon name="Info" size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {hover && (
        <HoverPortal anchor={hover.rect}>
          <ShiftDayDetails
            date={hover.date}
            shifts={byDate[hover.date] || []}
            tasks={tasksByDate[hover.date] || []}
          />
        </HoverPortal>
      )}

      {loading && <div className="text-sm text-gray-400 mt-3">Загружаем график…</div>}
      {!loading && shifts.length === 0 && (
        <div className="text-sm text-gray-500 mt-3">
          Смен пока нет. Нажмите на любой день, чтобы поставить смену.
        </div>
      )}
      {!loading && shifts.length > 0 && (
        <div className="text-xs text-gray-400 mt-3">
          Две галочки в ячейке — смена открыта и закрыта. Наведите на день, чтобы увидеть время и
          задачи. Клик по дню — назначить администратора и поставить задачи.
        </div>
      )}

      {tapDate && (
        <ShiftDayDetails
          asModal
          date={tapDate}
          shifts={byDate[tapDate] || []}
          tasks={tasksByDate[tapDate] || []}
          onClose={() => setTapDate(null)}
        />
      )}

      {editDate && (
        <ShiftEditor
          date={editDate}
          admins={admins}
          shifts={shifts}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditDate(null)}
        />
      )}
    </div>
  );
};

export default AdminShiftsView;