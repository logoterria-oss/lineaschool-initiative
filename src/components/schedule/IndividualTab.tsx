import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  S20_URL,
  DayGroup,
  Slot,
  TEACHER_SHORT,
  TEACHER_COLOR,
} from './types';

const IndividualTab = () => {
  const [days, setDays] = useState<DayGroup[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  const loadSlots = async () => {
    setSlotsLoading(true);
    setSlotsError('');
    try {
      const resp = await fetch(`${S20_URL}?mode=free_slots`);
      const data = await resp.json();
      const slots = data.slots_by_weekday;
      setDays(Array.isArray(slots) ? slots : []);
    } catch {
      setSlotsError('Не удалось загрузить свободные окна');
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
     
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Свободные окна по графику педагогов на ближайшие 4 недели
        </p>
        <Button variant="outline" size="sm" onClick={loadSlots} className="gap-1.5">
          <Icon name="RefreshCw" size={14} />
          Обновить
        </Button>
      </div>

      {slotsLoading && (
        <div className="text-center py-12 text-gray-500">
          <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-3" />
          Загрузка из S20…
        </div>
      )}

      {slotsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
          {slotsError}
        </div>
      )}

      {!slotsLoading && !slotsError && days.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Icon name="CalendarOff" size={36} className="mx-auto mb-3" />
          Свободных окон нет
        </div>
      )}

      {!slotsLoading && days.length > 0 && (
        <>
          {/* Легенда */}
          <div className="flex flex-wrap gap-2 mb-5">
            {Object.entries(TEACHER_SHORT).map(([id, name]) => (
              <span
                key={id}
                className={`text-xs font-medium px-3 py-1 rounded-full border ${TEACHER_COLOR[Number(id)]}`}
              >
                {name}
              </span>
            ))}
          </div>

          {/* Карточки по дням */}
          <div className="grid md:grid-cols-2 gap-4">
            {days.map((day) => {
              const byTime: Record<string, Slot[]> = {};
              day.slots.forEach((s) => {
                const key = `${s.time_from}–${s.time_to}`;
                if (!byTime[key]) byTime[key] = [];
                byTime[key].push(s);
              });

              return (
                <div
                  key={day.weekday}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <div className="bg-teal-600 px-4 py-2.5 flex items-center gap-2">
                    <Icon name="CalendarDays" size={15} className="text-teal-100" />
                    <span className="font-semibold text-white text-sm">{day.weekday_name}</span>
                    <span className="ml-auto text-teal-200 text-xs">
                      {Object.keys(byTime).length} окон
                    </span>
                  </div>
                  <div className="p-3 space-y-1.5">
                    {Object.entries(byTime)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([timeKey, slots]) => (
                        <div
                          key={timeKey}
                          className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                        >
                          <span className="font-mono font-semibold text-gray-800 text-sm">
                            {timeKey}
                          </span>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {slots.map((s) => (
                              <span
                                key={s.teacher_id}
                                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TEACHER_COLOR[s.teacher_id] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                              >
                                {TEACHER_SHORT[s.teacher_id] || s.teacher_name.split(' ')[0]}
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
        </>
      )}
    </>
  );
};

export default IndividualTab;
