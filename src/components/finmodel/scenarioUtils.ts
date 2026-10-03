import * as XLSX from 'xlsx';
import { SCENARIOS, SCENARIO_LABEL, ScenarioAnnual, ScenariosData, SensParam, fmMonthLabel } from '@/lib/finmodelApi';

export const SC_COLOR: Record<string, string> = { min: '#f43f5e', base: '#4f46e5', opt: '#059669' };
export const EXTRA_COLORS = ['#d97706', '#0891b2', '#7c3aed', '#db2777', '#65a30d', '#475569', '#ea580c'];

export const num = (v: number) => Math.round(v).toLocaleString('ru-RU');
export const kRub = (v: number) => `${Math.round(v / 1000).toLocaleString('ru-RU')}к`;

/** Цветовая индикация: красный — минус, жёлтый — около нуля, зелёный — плюс. */
export const toneCls = (v: number, nearZero: number) =>
  v < 0 ? 'text-rose-600 bg-rose-50' : v < nearZero ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50';

export const COMPARE_ROWS: { key: keyof ScenarioAnnual; label: string; strong?: boolean; tone?: boolean }[] = [
  { key: 'avans', label: 'Авансы' },
  { key: 'fact', label: 'Факт' },
  { key: 'revenue', label: 'Поступления' },
  { key: 'variable', label: 'Переменные расходы' },
  { key: 'gross_profit', label: 'Валовая прибыль' },
  { key: 'fixed', label: 'Постоянные расходы' },
  { key: 'ano', label: 'АНО' },
  { key: 'one_time', label: 'Разовые расходы' },
  { key: 'ebitda', label: 'EBITDA', tone: true },
  { key: 'interest', label: 'Проценты по кредиту' },
  { key: 'tax', label: 'Налог' },
  { key: 'net_profit', label: 'Чистая прибыль', strong: true, tone: true },
  { key: 'payout', label: 'Выплата собственнику' },
  { key: 'body', label: 'Кредит: тело' },
  { key: 'net_flow', label: 'Чистый поток Cash Flow', tone: true },
  { key: 'end_balance', label: 'Остаток на конец', strong: true, tone: true },
];

export const SENS_LABEL: Record<SensParam, string> = {
  price: 'Цена абонемента',
  students: 'Ученики',
  advertising: 'Реклама в месяц',
  staff: 'Педагоги в найм',
};

export const fmSensValue = (p: SensParam, v: number) =>
  p === 'students' ? `${v} уч.` : p === 'staff' ? (v ? `+${v} пед.` : 'без изменений') : `${num(v)} ₽`;

export function exportScenariosXlsx(data: ScenariosData, ids: string[]) {
  const wb = XLSX.utils.book_new();
  const names = ids.map((id) => data.scenarios.find((s) => s.id === id)?.name || id);

  const cmp = [['Показатель', ...names]];
  COMPARE_ROWS.forEach((r) => cmp.push([r.label, ...ids.map((id) => Math.round(Number(data.results[id].annual[r.key]) || 0))] as never));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cmp), 'Сравнение');

  const monthly: (string | number)[][] = [['Месяц', ...names.flatMap((n) => [`${n}: чистая прибыль`, `${n}: остаток`])]];
  data.months.forEach((m, i) =>
    monthly.push([
      fmMonthLabel(m),
      ...ids.flatMap((id) => {
        const row = data.results[id].monthly[i];
        return [Math.round(row?.net_profit ?? 0), Math.round(row?.end_balance ?? 0)];
      }),
    ]),
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthly), 'Помесячно');

  (Object.keys(data.sensitivity) as SensParam[]).forEach((p) => {
    const t = data.sensitivity[p];
    const sheet: (string | number)[][] = [
      [SENS_LABEL[p], ...SCENARIOS.map((s) => `${SCENARIO_LABEL[s]}: чистая прибыль`), ...SCENARIOS.map((s) => `${SCENARIO_LABEL[s]}: остаток`)],
    ];
    t.values.forEach((v, i) =>
      sheet.push([
        v,
        ...SCENARIOS.map((s) => Math.round(t.results[s][i].net_profit)),
        ...SCENARIOS.map((s) => Math.round(t.results[s][i].end_balance)),
      ]),
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet), `Чувств. ${SENS_LABEL[p]}`.slice(0, 31));
  });

  XLSX.writeFile(wb, `Сценарии_${data.current_month}.xlsx`);
}
