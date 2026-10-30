import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { listStaff, Staff } from '@/lib/staffApi';
import { FIRST_QUARTER, KPI_METRICS, KpiMetric, Quarter, isTestStaff, quartersUntil } from './kpiSummary';

const shortName = (full: string) => full.split(' ').slice(0, 2).join(' ');

const MetricCard = ({ metric, people, quarter }: { metric: KpiMetric; people: Staff[]; quarter: Quarter }) => {
  const [openId, setOpenId] = useState<number | null>(null);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">{metric.title}</h3>
        <p className="text-xs text-gray-500">{metric.description} · до {metric.maxPoints} баллов</p>
      </div>
      {people.map((p) => {
        const open = openId === p.id;
        return (
          <div key={p.id} className="border-t border-gray-100 first:border-t-0">
            <button
              onClick={() => setOpenId(open ? null : p.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50"
            >
              <span className="font-medium text-gray-800 flex-1">{shortName(p.full_name)}</span>
              <span className="text-sm text-gray-400">— баллов</span>
              <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-gray-400" />
            </button>
            {open && (
              <div className="px-4 pb-3 grid sm:grid-cols-3 gap-2">
                {quarter.months.map((m) => (
                  <div key={m.id} className="rounded-lg bg-gray-50 px-3 py-2">
                    <div className="text-xs text-gray-500">{m.label}</div>
                    <div className="text-sm text-gray-400">Нет данных</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Общая сводка по показателям администраторов — видна только руководителям.
const AdminKpiSummaryView = () => {
  const [people, setPeople] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarters, setQuarters] = useState<Quarter[]>([FIRST_QUARTER]);
  const [quarterId, setQuarterId] = useState(FIRST_QUARTER.id);

  useEffect(() => {
    setQuarters(quartersUntil(new Date()));
    listStaff().then((list) => {
      const active = list.filter(
        (s) => (s.role === 'admin' || s.role === 'head') && s.status === 'active' && !isTestStaff(s),
      );
      active.sort((a, b) => (a.role === b.role ? a.full_name.localeCompare(b.full_name, 'ru') : a.role === 'admin' ? -1 : 1));
      setPeople(active);
      setLoading(false);
    });
  }, []);

  const quarter = quarters.find((q) => q.id === quarterId) || FIRST_QUARTER;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-wrap items-center gap-3">
        <div className="p-2 bg-violet-100 rounded-lg">
          <Icon name="LayoutDashboard" size={24} className="text-violet-600" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-xl font-bold text-gray-900">Общая сводка</h2>
          <p className="text-sm text-gray-500">Баллы KPI по каждой метрике отдельно</p>
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

      {loading ? (
        <div className="py-10 text-center text-gray-400 bg-white rounded-xl border border-gray-200">
          <Icon name="Loader2" size={24} className="animate-spin mx-auto mb-2" />
          Загрузка…
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {people.map((p) => (
              <span key={p.id} className="px-3 py-1 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
                {shortName(p.full_name)}
                {p.role === 'head' && <span className="text-gray-400"> · {p.job_title || 'руководитель'}</span>}
              </span>
            ))}
          </div>

          {KPI_METRICS.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
              <div className="w-14 h-14 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="ListChecks" size={26} className="text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Метрики KPI ещё не заданы</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Когда метрики появятся, здесь будет отдельная карточка по каждой: баллы сотрудников за {quarter.label} и подробная расшифровка по месяцам.
              </p>
            </div>
          ) : (
            KPI_METRICS.map((m) => <MetricCard key={m.id} metric={m} people={people} quarter={quarter} />)
          )}
        </>
      )}
    </div>
  );
};

export default AdminKpiSummaryView;
