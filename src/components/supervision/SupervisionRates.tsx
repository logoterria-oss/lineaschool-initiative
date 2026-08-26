import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Supervision, fetchSupervisions } from '@/lib/supervisionsApi';
import {
  GROUP_TEACHERS,
  INDIVIDUAL_TEACHERS,
  LessonForm,
  maxTotalScore,
} from '@/lib/supervisionChecklist';
import {
  ReportPeriod,
  currentPeriod,
  periodsRange,
  previousPeriod,
} from '@/lib/supervisionPeriods';
import { BASE_RATE, fmtRate, rateFromScore } from '@/lib/supervisionRate';

const ALL_TEACHERS = [...INDIVIDUAL_TEACHERS, ...GROUP_TEACHERS];

const selectCls =
  'h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400';

const formLabel = (f: LessonForm) => (f === 'group' ? 'Групповые' : 'Индивидуальные');

interface Row {
  teacherId: number;
  teacherName: string;
  form: LessonForm;
  count: number;
  avg: number | null;
  prevRate: number;
  prevCount: number;
  nextRate: number;
  needed: number | null;
  nextTierRate: number | null;
}

const SupervisionRates = () => {
  const [items, setItems] = useState<Supervision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const now = new Date();
  const periods = useMemo(() => periodsRange(now.getFullYear() - 2, now.getFullYear()), [now]);
  const [periodKey, setPeriodKey] = useState(() => currentPeriod(now).key);

  const period: ReportPeriod = useMemo(
    () => periods.find((p) => p.key === periodKey) ?? periods[periods.length - 1],
    [periods, periodKey],
  );
  const prev = useMemo(() => previousPeriod(period), [period]);

  useEffect(() => {
    fetchSupervisions()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo<Row[]>(() => {
    const inPeriod = (s: Supervision, p: ReportPeriod) =>
      !!s.supervision_date && s.supervision_date >= p.from && s.supervision_date <= p.to;

    const avgOf = (list: Supervision[]) =>
      list.length === 0
        ? null
        : Math.round((list.reduce((s, i) => s + i.total_score, 0) / list.length) * 10) / 10;

    // Пары «педагог + форма» берём из справочника и из фактических супервизий
    const pairs = new Map<string, { teacherId: number; teacherName: string; form: LessonForm }>();
    const add = (teacherId: number, teacherName: string, form: LessonForm) =>
      pairs.set(`${teacherId}-${form}`, { teacherId, teacherName, form });
    GROUP_TEACHERS.forEach((t) => add(t.id, t.name, 'group'));
    INDIVIDUAL_TEACHERS.forEach((t) => add(t.id, t.name, 'individual'));
    items.forEach((s) => add(s.teacher_id, s.teacher_name, s.lesson_form));

    return Array.from(pairs.values())
      .map(({ teacherId, teacherName, form }) => {
        const mine = items.filter((s) => s.teacher_id === teacherId && s.lesson_form === form);
        const cur = mine.filter((s) => inPeriod(s, period));
        const old = mine.filter((s) => inPeriod(s, prev));

        const avg = avgOf(cur);
        const prevAvg = avgOf(old);

        const prevRate = prevAvg === null ? BASE_RATE : rateFromScore(form, prevAvg).rate;
        const next = avg === null ? null : rateFromScore(form, avg);

        return {
          teacherId,
          teacherName,
          form,
          count: cur.length,
          avg,
          prevRate,
          prevCount: old.length,
          nextRate: next ? next.rate : prevRate,
          needed: next?.next ? next.next.needed : null,
          nextTierRate: next?.next ? next.next.rate : null,
        };
      })
      .filter((r) => r.count > 0 || r.prevCount > 0)
      .sort((a, b) => a.teacherName.localeCompare(b.teacherName, 'ru'));
  }, [items, period, prev]);

  if (loading) return <p className="text-gray-500">Загрузка…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Отчётный период</label>
            <select
              className={selectCls}
              value={period.key}
              onChange={(e) => setPeriodKey(e.target.value)}
            >
              {[...periods].reverse().map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-gray-500 pb-2">
            Прошлый период: <span className="font-medium text-gray-700">{prev.label}</span>
          </p>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Ставка на следующий период считается по среднему баллу супервизий за выбранный период.
          Базовая ставка — {fmtRate(BASE_RATE)}.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left font-medium px-4 py-3">Педагог</th>
              <th className="text-left font-medium px-4 py-3">Форма</th>
              <th className="text-left font-medium px-4 py-3">Супервизий</th>
              <th className="text-left font-medium px-4 py-3">Средний балл</th>
              <th className="text-left font-medium px-4 py-3">Прошлая ставка</th>
              <th className="text-left font-medium px-4 py-3">Планируемая ставка</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  За выбранный период супервизий нет
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const up = r.nextRate > r.prevRate;
              const down = r.nextRate < r.prevRate;
              return (
                <tr key={`${r.teacherId}-${r.form}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.teacherName}</td>
                  <td className="px-4 py-3 text-gray-600">{formLabel(r.form)}</td>
                  <td className="px-4 py-3 text-gray-600">{r.count}</td>
                  <td className="px-4 py-3">
                    {r.avg === null ? (
                      <span className="text-gray-400">нет данных</span>
                    ) : (
                      <span className="font-semibold text-gray-900">
                        {r.avg}
                        <span className="text-gray-400 font-normal">
                          {' '}
                          из {maxTotalScore(r.form)}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.prevCount > 0 ? (
                      fmtRate(r.prevRate)
                    ) : (
                      <span className="text-gray-400">{fmtRate(r.prevRate)} (база)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${
                          up ? 'text-emerald-600' : down ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {fmtRate(r.nextRate)}
                      </span>
                      {up && <Icon name="TrendingUp" size={16} className="text-emerald-600" />}
                      {down && <Icon name="TrendingDown" size={16} className="text-red-600" />}
                    </div>
                    {r.needed !== null && r.nextTierRate !== null && r.avg !== null && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        до {fmtRate(r.nextTierRate)} не хватает {r.needed} балла
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupervisionRates;
