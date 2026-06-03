import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { S20_URL, TEACHER_SHORT, TEACHER_COLOR, getMonday, addDays, fmtDate, fmtRu, WEEKDAY_SHORT } from './types';

interface IndSlot {
  time_from: string;
  time_to: string;
  teacher_id: number;
  teacher_name: string;
  busy: boolean;
  lesson_id?: number;
}

interface IndDay {
  date: string;
  weekday: number;
  weekday_name: string;
  slots: IndSlot[];
}

const IndividualTab = () => {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [days, setDays] = useState<IndDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async (ws: Date) => {
    setLoading(true);
    setError('');
    try {
      const df = fmtDate(ws);
      const dt = fmtDate(addDays(ws, 5));
      const resp = await fetch(`${S20_URL}?mode=ind_week&date_from=${df}&date_to=${dt}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setDays(Array.isArray(data.days) ? data.days : []);
    } catch (e) {
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(weekStart); }, [weekStart]);

  const prevWeek = () => setWeekStart((w) => addDays(w, -7));
  const nextWeek = () => setWeekStart((w) => addDays(w, 7));

  const weekEnd = addDays(weekStart, 5);
  const weekLabel = `${fmtRu(weekStart)} – ${fmtRu(weekEnd)}`;

  // Группируем свободные слоты по времени внутри каждого дня
  const groupByTime = (slots: IndSlot[]) => {
    const map: Record<string, IndSlot[]> = {};
    for (const s of slots.filter((s) => !s.busy)) {
      if (!map[s.time_from]) map[s.time_from] = [];
      map[s.time_from].push(s);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  };

  return (
    <>
      {/* Навигация по неделям */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <Icon name="ChevronLeft" size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[130px] text-center">
            {weekLabel}
          </span>
          <button
            onClick={nextWeek}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <Icon name="ChevronRight" size={18} />
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(weekStart)} className="gap-1.5">
          <Icon name="RefreshCw" size={14} />
          Обновить
        </Button>
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap gap-2 mb-5">
        {Object.entries(TEACHER_SHORT).map(([id, name]) => (
          <span key={id} className={`text-xs font-medium px-3 py-1 rounded-full border ${TEACHER_COLOR[Number(id)]}`}>
            {name}
          </span>
        ))}

      </div>

      {loading && (
        <div className="text-center py-12 text-gray-500">
          <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-3" />
          Загрузка из S20…
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">{error}</div>
      )}

      {!loading && !error && days.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Icon name="CalendarOff" size={36} className="mx-auto mb-3" />
          <p>Нет рабочих окон на эту неделю</p>
        </div>
      )}

      {!loading && days.length > 0 && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {days.map((day) => {
            const timeGroups = groupByTime(day.slots);
            const freeCount = day.slots.filter((s) => !s.busy).length;
            if (freeCount === 0) return null;

            return (
              <div key={day.date} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Шапка дня */}
                <div className="bg-teal-600 px-4 py-2.5 flex items-center gap-2">
                  <Icon name="CalendarDays" size={14} className="text-teal-100" />
                  <span className="font-semibold text-white text-sm">
                    {WEEKDAY_SHORT[day.weekday]} {fmtRu(new Date(`${day.date}T00:00:00`))}
                  </span>
                  <span className="ml-auto text-teal-200 text-xs">
                    {freeCount} окн.
                  </span>
                </div>

                {/* Слоты */}
                <div className="p-3 space-y-1.5">
                  {timeGroups.map(([time, slots]) => (
                    <div key={time} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <span className="font-mono font-semibold text-gray-800 text-sm w-12 flex-shrink-0">
                        {time}
                      </span>
                      <div className="flex flex-wrap gap-1 flex-1 justify-end">
                        {slots.map((s) => (
                          <span
                            key={s.teacher_id}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              s.busy
                                ? 'bg-gray-100 text-gray-400 border-gray-200 line-through'
                                : TEACHER_COLOR[s.teacher_id] || 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                          >
                            {s.busy && <Icon name="X" size={10} />}
                            {TEACHER_SHORT[s.teacher_id] || s.teacher_name.split(' ')[1] || s.teacher_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default IndividualTab;