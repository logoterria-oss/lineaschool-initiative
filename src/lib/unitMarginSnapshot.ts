import type { Supervision } from '@/lib/supervisionsApi';
import type { TeacherRate } from '@/lib/teacherRatesApi';
import {
  UnitFact, UnitMarginReport, fetchUnitDefaults, fetchUnitFact, fetchUnitReports, saveUnitReport,
} from '@/lib/unitMarginApi';
import { fetchSupervisions } from '@/lib/supervisionsApi';
import { fetchTeacherRates } from '@/lib/teacherRatesApi';
import { weightedRate } from '@/lib/unitTeacherRates';
import {
  DEFAULT_RATES, DEFAULT_TEACHER_RATE, FIRST_REPORT_MONTH, UnitMarginInputs, UnitMarginResults, UnitMonthTotals,
  calcAll, calcMonthTotals, monthLabel,
} from '@/lib/unitMarginModel';

export interface MonthSnapshot {
  inputs: UnitMarginInputs;
  result: UnitMarginResults;
  totals: UnitMonthTotals;
}

/**
 * Расчёт месяца тем же способом, что и экран отчёта: цены и наполняемость —
 * факт CRM месяца, ставки и проценты — из пресета, ставки педагогов — точные
 * по супервизиям (если нашлись).
 */
export function buildMonthSnapshot(
  month: string,
  fact: UnitFact,
  base: Pick<UnitMarginInputs, 'individual' | 'group' | 'rates'>,
  supervisions: Supervision[],
  teacherRates: TeacherRate[],
  useRealRates = true,
): MonthSnapshot {
  const inputs: UnitMarginInputs = {
    periodMonth: month,
    rates: { ...base.rates },
    individual: { ...base.individual, price: fact.individual.avg_price, groupSize: fact.individual.avg_group_size || 1 },
    group: { ...base.group, price: fact.group.avg_price, groupSize: fact.group.avg_group_size || base.group.groupSize },
  };
  if (useRealRates) {
    const wi = weightedRate(fact.teachers, 'individual', month, supervisions, teacherRates, base.individual.rate);
    const wg = weightedRate(fact.teachers, 'group', month, supervisions, teacherRates, base.group.rate);
    if (wi.lessons > 0) inputs.individual.rate = wi.rate;
    if (wg.lessons > 0) inputs.group.rate = wg.rate;
  }
  const result = calcAll(inputs);
  return { inputs, result, totals: calcMonthTotals(result, fact.individual.lessons, fact.group.lessons) };
}

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Завершённые месяцы с начала отчётности, которые ещё не зафиксированы. */
const pendingMonths = (reports: UnitMarginReport[]) => {
  const done = new Set(reports.map((r) => r.period_month));
  const out: string[] = [];
  const cm = currentMonth();
  const [y0, m0] = FIRST_REPORT_MONTH.split('-').map(Number);
  const d = new Date(y0, m0 - 1, 1);
  for (;;) {
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (m >= cm) break;
    if (!done.has(m)) out.push(m);
    d.setMonth(d.getMonth() + 1);
  }
  return out;
};

/** Пресет ставок, супервизии и ставки педагогов — всё, что нужно для расчёта месяца как в отчёте. */
async function loadSnapshotContext() {
  const [preset, supervisions, teacherRates] = await Promise.all([
    fetchUnitDefaults().catch(() => null),
    fetchSupervisions().catch(() => [] as Supervision[]),
    fetchTeacherRates().catch(() => [] as TeacherRate[]),
  ]);
  const base = {
    rates: { ...DEFAULT_RATES, ...(preset?.rates || {}) },
    individual: { price: 0, rate: DEFAULT_TEACHER_RATE, groupSize: 1, ...(preset?.individual || {}) },
    group: { price: 0, rate: DEFAULT_TEACHER_RATE, groupSize: 4, ...(preset?.group || {}) },
  };
  return { base, supervisions, teacherRates };
}

/**
 * Маржинальность текущего (идущего) месяца — ровно та цифра, что показывает
 * отчёт «Маржинальность урока» при выборе текущего месяца. null — данных нет.
 */
export async function currentMonthMargin(): Promise<{ month: string; marginPercent: number } | null> {
  const m = currentMonth();
  if (m < FIRST_REPORT_MONTH) return null;
  const [{ base, supervisions, teacherRates }, fact] = await Promise.all([
    loadSnapshotContext(),
    fetchUnitFact(m),
  ]);
  if (!fact || (fact.individual.lessons || 0) + (fact.group.lessons || 0) === 0) return null;
  const snap = buildMonthSnapshot(m, fact, base, supervisions, teacherRates);
  const pct = Number(snap.totals.marginPercent);
  return Number.isFinite(pct) ? { month: m, marginPercent: pct } : null;
}

/**
 * Автоматическая фиксация: каждый завершённый месяц сохраняется один раз
 * (сервер повторно тот же месяц не перезаписывает). Запускается при открытии
 * отчёта «Маржинальность урока» и финмодели — то есть с 1-го числа, как только
 * кто-то зашёл. Возвращает актуальный список зафиксированных месяцев.
 */
export async function autoFixClosedMonths(): Promise<UnitMarginReport[]> {
  const reports = await fetchUnitReports();
  const pending = pendingMonths(reports);
  if (pending.length === 0) return reports;

  const { base, supervisions, teacherRates } = await loadSnapshotContext();

  for (const m of pending) {
    try {
      const fact = await fetchUnitFact(m, true);
      const snap = buildMonthSnapshot(m, fact, base, supervisions, teacherRates);
      await saveUnitReport({
        period_month: m,
        title: monthLabel(m),
        inputs: snap.inputs,
        result: { ...snap.result, monthTotals: snap.totals },
        note: 'Зафиксировано автоматически после окончания месяца',
      });
    } catch {
      // Не получилось (CRM не ответила) — попробуем при следующем открытии.
    }
  }
  return fetchUnitReports();
}