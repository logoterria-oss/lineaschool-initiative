import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
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
  nextPeriod,
  periodsRange,
  previousPeriod,
} from '@/lib/supervisionPeriods';
import { BASE_RATE, rateFromScore } from '@/lib/supervisionRate';
import {
  TeacherRate,
  fetchTeacherRates,
  rateKey,
  saveTeacherRate,
} from '@/lib/teacherRatesApi';
import RateCell from './RateCell';

const selectCls =
  'h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400';

const formLabel = (f: LessonForm) => (f === 'group' ? 'Групповые' : 'Индивидуальные');

interface Row {
  teacherId: number;
  teacherName: string;
  form: LessonForm;
  count: number;
  avg: number | null;
  currentRate: number;
  currentManual: boolean;
  plannedRate: number;
  plannedManual: boolean;
  plannedLocked: boolean;
  needed: number | null;
  nextTierRate: number | null;
}

const SupervisionRates = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Supervision[]>([]);
  const [rates, setRates] = useState<TeacherRate[]>([]);
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
  const upcoming = useMemo(() => nextPeriod(period), [period]);

  useEffect(() => {
    Promise.all([fetchSupervisions(), fetchTeacherRates()])
      .then(([sup, rt]) => {
        setItems(sup);
        setRates(rt);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  const savedByKey = useMemo(() => {
    const map = new Map<string, TeacherRate>();
    rates.forEach((r) => map.set(rateKey(r.teacher_id, r.lesson_form, r.period_key), r));
    return map;
  }, [rates]);

  const rows = useMemo<Row[]>(() => {
    const inPeriod = (s: Supervision, p: ReportPeriod) =>
      !!s.supervision_date && s.supervision_date >= p.from && s.supervision_date <= p.to;

    const avgOf = (list: Supervision[]) =>
      list.length === 0
        ? null
        : Math.round((list.reduce((s, i) => s + i.total_score, 0) / list.length) * 10) / 10;

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

        const saved = savedByKey.get(rateKey(teacherId, form, period.key));
        // Планируемую на этот период могли зафиксировать в прошлом периоде
        const savedPrev = savedByKey.get(rateKey(teacherId, form, prev.key));

        // Текущая ставка: ручная правка → зафиксированная в прошлом периоде → расчёт по прошлым баллам
        const autoCurrent = prevAvg === null ? BASE_RATE : rateFromScore(form, prevAvg).rate;
        const lockedFromPrev =
          savedPrev?.planned_locked && savedPrev.planned_rate != null
            ? savedPrev.planned_rate
            : null;
        const currentRate = saved?.current_rate ?? lockedFromPrev ?? autoCurrent;

        // Планируемая: ручная правка → расчёт по баллам текущего периода
        const calc = avg === null ? null : rateFromScore(form, avg);
        const autoPlanned = calc ? calc.rate : currentRate;
        const plannedRate = saved?.planned_rate ?? autoPlanned;

        return {
          teacherId,
          teacherName,
          form,
          count: cur.length,
          avg,
          currentRate,
          currentManual: saved?.current_rate != null,
          plannedRate,
          plannedManual: saved?.planned_rate != null,
          plannedLocked: !!saved?.planned_locked,
          needed: calc?.next ? calc.next.needed : null,
          nextTierRate: calc?.next ? calc.next.rate : null,
        };
      })
      .filter((r) => r.count > 0 || savedByKey.has(rateKey(r.teacherId, r.form, period.key)))
      .sort((a, b) => a.teacherName.localeCompare(b.teacherName, 'ru'));
  }, [items, period, prev, savedByKey]);

  const persist = async (
    row: Row,
    patch: { current_rate?: number | null; planned_rate?: number | null; planned_locked?: boolean },
  ) => {
    const saved = savedByKey.get(rateKey(row.teacherId, row.form, period.key));
    const payload = {
      teacher_id: row.teacherId,
      teacher_name: row.teacherName,
      lesson_form: row.form,
      period_key: period.key,
      current_rate: saved?.current_rate ?? null,
      planned_rate: saved?.planned_rate ?? null,
      planned_locked: saved?.planned_locked ?? false,
      ...patch,
    };
    try {
      const res = await saveTeacherRate(payload);
      setRates((prevRates) => {
        const k = rateKey(res.teacher_id, res.lesson_form, res.period_key);
        const rest = prevRates.filter(
          (r) => rateKey(r.teacher_id, r.lesson_form, r.period_key) !== k,
        );
        return [...rest, res];
      });
    } catch (e) {
      toast({
        title: 'Не удалось сохранить',
        description: e instanceof Error ? e.message : '',
        variant: 'destructive',
      });
    }
  };

  const toggleLock = async (row: Row) => {
    const locking = !row.plannedLocked;
    await persist(row, {
      planned_locked: locking,
      // При фиксации запоминаем сумму, чтобы она не «поплыла» от новых супервизий
      planned_rate: locking ? row.plannedRate : row.plannedManual ? row.plannedRate : null,
    });
    toast({
      title: locking ? 'Ставка зафиксирована' : 'Фиксация снята',
      description: `${row.teacherName} · ${upcoming.label}`,
    });
  };

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
            Планируемая ставка — на период{' '}
            <span className="font-medium text-gray-700">{upcoming.label}</span>
          </p>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Планируемая ставка рассчитывается по среднему баллу супервизий за выбранный период.
          Любую сумму можно изменить вручную — нажмите на неё. Базовая ставка — {BASE_RATE} ₽/час.
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
              <th className="text-left font-medium px-4 py-3">Текущая ставка</th>
              <th className="text-left font-medium px-4 py-3">Планируемая ставка</th>
              <th className="text-left font-medium px-4 py-3">Фиксация</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  За выбранный период супервизий нет
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const up = r.plannedRate > r.currentRate;
              const down = r.plannedRate < r.currentRate;
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
                        <span className="text-gray-400 font-normal"> из {maxTotalScore(r.form)}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <RateCell
                      value={r.currentRate}
                      manual={r.currentManual}
                      onSave={(v) => persist(r, { current_rate: v })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RateCell
                        value={r.plannedRate}
                        manual={r.plannedManual}
                        disabled={r.plannedLocked}
                        className={up ? 'text-emerald-600' : down ? 'text-red-600' : 'text-gray-900'}
                        onSave={(v) => persist(r, { planned_rate: v })}
                      />
                      {up && <Icon name="TrendingUp" size={16} className="text-emerald-600" />}
                      {down && <Icon name="TrendingDown" size={16} className="text-red-600" />}
                    </div>
                    {!r.plannedLocked && r.needed !== null && r.nextTierRate !== null && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        до {r.nextTierRate} ₽/час не хватает {r.needed} балла
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleLock(r)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                        r.plannedLocked
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={
                        r.plannedLocked
                          ? 'Снять фиксацию'
                          : `Зафиксировать ставку на ${upcoming.label}`
                      }
                    >
                      <Icon name={r.plannedLocked ? 'Lock' : 'LockOpen'} size={14} />
                      {r.plannedLocked ? 'Зафиксирована' : 'Зафиксировать'}
                    </button>
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
