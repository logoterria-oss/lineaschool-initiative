import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const TEACHER_SCHEDULE_URL = 'https://functions.poehali.dev/6dcf4744-e843-45cf-9614-9afe432b92f5';

const INDIVIDUAL_TEACHERS = [
  { id: 4,  name: 'Еремина Дарья' },
  { id: 18, name: 'Карамова Анна' },
  { id: 11, name: 'Камнева Валерия' },
  { id: 2,  name: 'Шишаева Анастасия' },
];

const GROUP_TEACHERS = [
  { id: 20, name: 'Канкулова Екатерина' },
  { id: 15, name: 'Мацвей Екатерина' },
];

const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

// HH:MM строки для выбора
const TIME_OPTIONS: string[] = [];
for (let h = 8; h <= 21; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
}

interface ScheduleRow { id?: number; weekday: number; time_from: string; time_to: string; }
type WeekSchedule = Record<number, string[]>; // weekday -> sorted time_from[]

function rowsToWeekSchedule(rows: ScheduleRow[]): WeekSchedule {
  const ws: WeekSchedule = {};
  for (const r of rows) {
    if (!ws[r.weekday]) ws[r.weekday] = [];
    ws[r.weekday].push(r.time_from.slice(0, 5));
  }
  for (const k of Object.keys(ws)) ws[Number(k)].sort();
  return ws;
}

function weekScheduleToSlots(ws: WeekSchedule): { weekday: number; time_from: string; time_to: string }[] {
  const slots: { weekday: number; time_from: string; time_to: string }[] = [];
  for (const [wdStr, times] of Object.entries(ws)) {
    const wd = Number(wdStr);
    for (const tf of times) {
      const [h, m] = tf.split(':').map(Number);
      const totalMin = h * 60 + m + 60;
      const tt = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
      slots.push({ weekday: wd, time_from: tf, time_to: tt });
    }
  }
  return slots;
}

interface TeacherCardProps {
  teacher: { id: number; name: string };
  onEdit: (t: { id: number; name: string }) => void;
  scheduleByTeacher: Record<number, ScheduleRow[]>;
  loading: boolean;
}

const TeacherCard = ({ teacher, onEdit, scheduleByTeacher, loading }: TeacherCardProps) => {
  const rows = scheduleByTeacher[teacher.id] || [];
  const ws = rowsToWeekSchedule(rows);
  const hasDays = Object.keys(ws).length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-900">{teacher.name}</span>
        <button
          onClick={() => onEdit(teacher)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Редактировать"
        >
          <Icon name="Pencil" size={16} />
        </button>
      </div>

      {loading ? (
        <div className="text-xs text-gray-400">Загрузка…</div>
      ) : !hasDays ? (
        <div className="text-xs text-gray-400 italic">Рабочее время не задано</div>
      ) : (
        <div className="space-y-1">
          {WEEKDAYS.map((name, wd) => {
            const times = ws[wd];
            if (!times || times.length === 0) return null;
            return (
              <div key={wd} className="flex items-start gap-2 text-sm">
                <span className="text-gray-500 w-24 flex-shrink-0">{name}</span>
                <div className="flex flex-wrap gap-1">
                  {times.map((t) => (
                    <span key={t} className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-md font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface EditModalProps {
  teacher: { id: number; name: string };
  initialWs: WeekSchedule;
  onClose: () => void;
  onSave: (teacherId: number, slots: { weekday: number; time_from: string; time_to: string }[]) => Promise<void>;
}

const EditModal = ({ teacher, initialWs, onClose, onSave }: EditModalProps) => {
  const [ws, setWs] = useState<WeekSchedule>(() => {
    const copy: WeekSchedule = {};
    for (const [k, v] of Object.entries(initialWs)) copy[Number(k)] = [...v];
    return copy;
  });
  const [saving, setSaving] = useState(false);
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [addTime, setAddTime] = useState('09:00');

  const removeTime = (wd: number, t: string) => {
    setWs((prev) => {
      const next = { ...prev };
      next[wd] = (next[wd] || []).filter((x) => x !== t);
      if (next[wd].length === 0) delete next[wd];
      return next;
    });
  };

  const addSlot = (wd: number) => {
    if (!addTime) return;
    setWs((prev) => {
      const next = { ...prev };
      const existing = next[wd] || [];
      if (existing.includes(addTime)) return prev;
      next[wd] = [...existing, addTime].sort();
      return next;
    });
    setAddingDay(null);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(teacher.id, weekScheduleToSlots(ws));
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="font-bold text-lg text-gray-900">Рабочее время</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
            <Icon name="X" size={20} />
          </button>
        </div>
        <p className="px-5 text-sm text-gray-500 mb-3 flex-shrink-0">{teacher.name}</p>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-3">
          {WEEKDAYS.map((dayName, wd) => {
            const times = ws[wd] || [];
            const isAdding = addingDay === wd;
            return (
              <div key={wd} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                  <span className="font-semibold text-gray-800 text-sm">{dayName}</span>
                  <button
                    onClick={() => { setAddingDay(wd); setAddTime('09:00'); }}
                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors text-lg font-light"
                  >
                    <Icon name="Plus" size={18} />
                  </button>
                </div>

                {isAdding && (
                  <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-green-50">
                    <select
                      value={addTime}
                      onChange={(e) => setAddTime(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => addSlot(wd)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      Добавить
                    </button>
                    <button
                      onClick={() => setAddingDay(null)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                )}

                {times.length === 0 && !isAdding ? (
                  <div className="px-4 py-4 text-center">
                    <p className="text-sm font-medium text-gray-400">Нет слотов</p>
                    <p className="text-xs text-gray-300 mt-0.5">Нажмите + и добавьте время для этого дня</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {times.map((t) => (
                      <div key={t} className="flex items-center justify-between px-4 py-2.5">
                        <span className="font-mono text-sm text-gray-800">{t}</span>
                        <button
                          onClick={() => removeTime(wd, t)}
                          className="text-gray-300 hover:text-red-400 transition-colors p-1"
                        >
                          <Icon name="X" size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 flex-shrink-0 space-y-2 border-t border-gray-100">
          <Button
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
          <button
            onClick={onClose}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

const WorkScheduleSection = () => {
  const [scheduleByTeacher, setScheduleByTeacher] = useState<Record<number, ScheduleRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingTeacher, setEditingTeacher] = useState<{ id: number; name: string } | null>(null);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const resp = await fetch(TEACHER_SCHEDULE_URL);
      const data = await resp.json();
      const byTeacher: Record<number, ScheduleRow[]> = {};
      for (const row of data.schedule || []) {
        if (!byTeacher[row.teacher_id]) byTeacher[row.teacher_id] = [];
        byTeacher[row.teacher_id].push(row);
      }
      setScheduleByTeacher(byTeacher);
    } catch {
      // не критично
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSchedule(); }, []);

  const handleSave = async (teacherId: number, slots: { weekday: number; time_from: string; time_to: string }[]) => {
    await fetch(TEACHER_SCHEDULE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_id: teacherId, slots }),
    });
    await loadSchedule();
  };

  const editingWs = editingTeacher
    ? rowsToWeekSchedule(scheduleByTeacher[editingTeacher.id] || [])
    : {};

  return (
    <div>
      {/* Индивидуальные */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Индивидуальные занятия
        </h3>
        <div className="space-y-3">
          {INDIVIDUAL_TEACHERS.map((t) => (
            <TeacherCard
              key={t.id}
              teacher={t}
              onEdit={setEditingTeacher}
              scheduleByTeacher={scheduleByTeacher}
              loading={loading}
            />
          ))}
        </div>
      </div>

      {/* Групповые */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Групповые занятия
        </h3>
        <div className="space-y-3">
          {GROUP_TEACHERS.map((t) => (
            <TeacherCard
              key={t.id}
              teacher={t}
              onEdit={setEditingTeacher}
              scheduleByTeacher={scheduleByTeacher}
              loading={loading}
            />
          ))}
        </div>
      </div>

      {editingTeacher && (
        <EditModal
          teacher={editingTeacher}
          initialWs={editingWs}
          onClose={() => setEditingTeacher(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default WorkScheduleSection;