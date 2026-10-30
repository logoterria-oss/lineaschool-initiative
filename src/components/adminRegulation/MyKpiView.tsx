import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { fetchResponseStats } from '@/lib/adminKpiApi';
import {
  Agg, FIRST_QUARTER, Quarter, TONE_CLASSES, avgOf, formatMinutes, quartersUntil, responseLevel,
} from './kpiSummary';
import ResponseMonths from './ResponseMonths';

// Личные показатели сотрудника (администратора или руководителя) — у каждого свои.
const MyKpiView = ({ staffName }: { staffName: string }) => {
  const [quarters, setQuarters] = useState<Quarter[]>([FIRST_QUARTER]);
  const [quarterId, setQuarterId] = useState(FIRST_QUARTER.id);
  const [byMonth, setByMonth] = useState<Record<string, Agg>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const quarter = quarters.find((q) => q.id === quarterId) || FIRST_QUARTER;

  useEffect(() => {
    setQuarters(quartersUntil(new Date()));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchResponseStats(quarter.from, quarter.to).then((res) => {
      if (!res) {
        setError(true);
        setLoading(false);
        return;
      }
      const map: Record<string, Agg> = {};
      res.rows.forEach((r) => {
        const cur = map[r.month] || { dialogs: 0, total: 0 };
        map[r.month] = { dialogs: cur.dialogs + r.dialogs, total: cur.total + r.total_minutes };
      });
      setByMonth(map);
      setLoading(false);
    });
  }, [quarter.from, quarter.to]);

  const total = Object.values(byMonth).reduce(
    (s, a) => ({ dialogs: s.dialogs + a.dialogs, total: s.total + a.total }),
    { dialogs: 0, total: 0 },
  );
  const avg = avgOf(total);
  const lvl = avg != null ? responseLevel(avg) : null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-wrap items-center gap-3">
        <div className="p-2 bg-sky-100 rounded-lg">
          <Icon name="UserCheck" size={24} className="text-sky-600" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-xl font-bold text-gray-900">Мои показатели</h2>
          <p className="text-sm text-gray-500">{staffName}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <Icon name="CalendarRange" size={16} className="text-gray-400" />
          <select
            value={quarterId}
            onChange={(e) => setQuarterId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800"
          >
            {quarters.map((q) => (
              <option key={q.id} value={q.id}>{q.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-start gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Icon name="Timer" size={20} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <h3 className="font-semibold text-gray-900">Скорость ответа</h3>
            <p className="text-xs text-gray-500">Среднее время от первого сообщения родителя до вашего ответа</p>
          </div>
          {!loading && lvl && avg != null && (
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">{formatMinutes(avg)}</div>
              <span className={`text-xs px-1.5 py-0.5 rounded ${TONE_CLASSES[lvl.tone]}`}>за квартал · {lvl.label}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-6 text-center text-gray-400">
            <Icon name="Loader2" size={20} className="animate-spin mx-auto" />
          </div>
        ) : error ? (
          <div className="py-4 text-center text-sm text-red-500">Не удалось загрузить показатели</div>
        ) : (
          <ResponseMonths quarter={quarter} byMonth={byMonth} showMoney />
        )}
        <p className="text-xs text-gray-400">
          Премия считается за каждый месяц: до 15 минут — 240 ₽, 15–30 минут — 120 ₽, больше 30 минут — 0 ₽.
        </p>
      </div>
    </div>
  );
};

export default MyKpiView;
