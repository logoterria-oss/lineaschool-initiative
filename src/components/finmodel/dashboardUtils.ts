import * as XLSX from 'xlsx';
import {
  AnoData, AvansData, CashflowData, CreditData, DashboardData, FactData, FixedData, OneTimeData, PayoutData, PnlData,
  RevenueData, SCENARIOS, SCENARIO_LABEL, Scenario, TaxData, fmMonthLabel,
} from '@/lib/finmodelApi';

export const EXPENSE_LABEL: Record<string, string> = {
  variable: 'Переменные',
  fixed: 'Постоянные',
  ano: 'АНО',
  one_time: 'Разовые',
  tax: 'Налог',
  interest: 'Кредит: проценты',
  body: 'Кредит: тело',
  payout: 'Выплата собственнику',
};

export const NOTIF_TYPE_LABEL: Record<string, string> = {
  month_not_closed: 'Месяц не закрыт',
  deviation: 'Отклонение от прогноза',
  variable_pct: 'Изменение переменного %',
  cash_gap: 'Кассовый разрыв',
  credit_overdue: 'Кредит',
  systematic: 'Систематическое отклонение',
  margin_missing: 'Маржинальность не сохранена',
  new_item: 'Новая неопределённость',
};

export const SOURCE_STATUS: Record<string, { label: string; cls: string }> = {
  ok: { label: 'актуально', cls: 'bg-emerald-50 text-emerald-700' },
  stale: { label: 'устарело', cls: 'bg-amber-50 text-amber-700' },
  missing: { label: 'нет данных', cls: 'bg-rose-50 text-rose-700' },
  manual: { label: 'вручную', cls: 'bg-gray-100 text-gray-600' },
};

/** Зелёный — плюс, жёлтый — около нуля (±10 % от базы), красный — минус, серый — нет данных. */
export const toneOf = (v: number | null | undefined, base: number) => {
  if (v == null || Number.isNaN(v)) return 'text-gray-400';
  if (Math.abs(v) <= Math.abs(base) * 0.1) return 'text-amber-600';
  return v < 0 ? 'text-rose-600' : 'text-emerald-700';
};

export interface ExportBundle {
  dash: DashboardData;
  avans: AvansData;
  fact: FactData;
  revenue: RevenueData;
  fixed: FixedData;
  oneTime: OneTimeData;
  credit: CreditData;
  ano: AnoData;
  taxes: TaxData;
  payouts: PayoutData;
  pnl: PnlData;
  cashflow: CashflowData;
  active: Scenario;
}

const r = (v: unknown) => (v == null || v === '' ? '' : Math.round(Number(v)));
type Row = (string | number)[];

/** Вся модель в xlsx: каждый блок — отдельный лист. Без внутренних id и служебных полей. */
export function exportModelXlsx(b: ExportBundle) {
  const wb = XLSX.utils.book_new();
  const sc = b.active;
  const add = (name: string, rows: Row[]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name.slice(0, 31));
  const k = b.dash.kpi[sc];

  add('KPI', [
    ['Показатель', ...SCENARIOS.map((s) => SCENARIO_LABEL[s])],
    ...([
      ['Авансы за 12 мес', 'avans'], ['Факт за 12 мес', 'fact'], ['Поступления', 'revenue'], ['Маржинальная прибыль', 'margin'],
      ['Чистая прибыль', 'net_profit'], ['Выплата собственнику', 'payout'], ['Остаток на конец', 'end_balance'],
      ['Минимальный остаток', 'min_balance'],
    ] as const).map(([l, key]) => [l, ...SCENARIOS.map((s) => r(b.dash.kpi[s][key]))]),
    [],
    ['Кредит закрывается', b.dash.credit.close_month ? fmMonthLabel(b.dash.credit.close_month) : '—'],
    ['Активный сценарий', SCENARIO_LABEL[sc]],
    ['Кассовый разрыв', k.gap_months.length ? `${fmMonthLabel(k.gap_months[0])} – ${fmMonthLabel(k.gap_months[k.gap_months.length - 1])}` : 'нет'],
    ['Обновлено', b.dash.last_updated ? new Date(b.dash.last_updated).toLocaleString('ru-RU') : ''],
  ]);

  add('Авансы', [
    ['Месяц', 'Прошлый год', ...SCENARIOS.map((s) => SCENARIO_LABEL[s])],
    ...b.avans.history.filter((h) => h.closed).map((h) => [fmMonthLabel(h.month_id), 'факт', r(h.avans), r(h.avans), r(h.avans)]),
    ...b.avans.forecast.map((f) => [fmMonthLabel(f.month_id), r(f.avans_prev_year), ...SCENARIOS.map((s) => r(f[s]?.forecast_final))]),
  ]);
  add('Факт', [
    ['Месяц', 'Прошлый год', ...SCENARIOS.map((s) => SCENARIO_LABEL[s])],
    ...b.fact.history.filter((h) => h.closed).map((h) => [fmMonthLabel(h.month_id), 'факт', r(h.fact), r(h.fact), r(h.fact)]),
    ...b.fact.forecast.map((f) => [fmMonthLabel(f.month_id), r(f.fact_prev_year), ...SCENARIOS.map((s) => r(f[s]?.fact_final))]),
  ]);
  add('Поступления и переменные', [
    ['Месяц', 'Аванс', 'Факт', 'Поступления', 'Переменный %', 'Переменные', 'Маржа'],
    ...b.revenue.forecast.map((f) => [fmMonthLabel(f.month_id), r(f[sc].avans), r(f[sc].fact), r(f[sc].revenue),
      Number(f.variable_pct), r(f[sc].variable_amount), r(f[sc].margin_amount)]),
  ]);
  add('Постоянные', [
    ['Статья', ...b.fixed.months.map(fmMonthLabel)],
    ...b.fixed.rows.map((row) => [row.name, ...b.fixed.months.map((m) => r(row.values[m]?.[sc]))]),
    ['Итого', ...b.fixed.months.map((m) => r(b.fixed.totals[m]?.total[sc]))],
  ]);
  add('Разовые', [
    ['Месяц', 'Название', 'Категория', 'Сумма', 'Комментарий'],
    ...b.oneTime.items.map((i) => [fmMonthLabel(i.month_id), i.name,
      b.oneTime.categories.find((c) => c.id === i.category)?.label || i.category, r(i.amount), i.comment]),
  ]);
  add('Кредит', [
    ['Месяц', 'Проценты', 'Тело', 'Платёж', 'Остаток долга'],
    ...b.credit.schedules[b.credit.option].filter((x) => x.status === 'active')
      .map((x) => [fmMonthLabel(x.month_id), r(x.interest), r(x.body), r(x.total), r(x.balance_after)]),
  ]);
  add('АНО', [['Месяц', 'Разово', 'Ежемесячно', 'Итого'], ...b.ano.rows.map((x) => [fmMonthLabel(x.month_id), r(x.one_time), r(x.monthly), r(x.total)])]);
  add('Налоги', [
    ['Месяц', 'Режим', 'База', 'Налог исходный', 'СФ', 'Налог итог'],
    ...b.taxes.rows.map((x) => [fmMonthLabel(x.month_id), x.regime === 'usn' ? 'УСН' : 'Патент', r(x.values[sc].base),
      r(x.values[sc].tax_gross), r(x.values[sc].social_fund), r(x.values[sc].tax_net)]),
  ]);
  add('Выплата', [
    ['Месяц', 'Поступления', 'Процент', 'Ручная', 'Итог'],
    ...b.payouts.rows.map((x) => [fmMonthLabel(x.month_id), r(x.values[sc]?.revenue), x.payout_pct, r(x.payout_manual), r(x.values[sc]?.payout_final)]),
  ]);
  const pnlKeys = [['revenue', 'Выручка (факт)'], ['variable', 'Переменные'], ['gross_profit', 'Валовая'], ['fixed', 'Постоянные'],
    ['ano', 'АНО'], ['one_time', 'Разовые'], ['ebitda', 'EBITDA'], ['interest', 'Проценты'], ['tax', 'Налог'], ['net_profit', 'Чистая прибыль']] as const;
  add('P&L', [
    ['Строка', ...b.pnl.rows.map((x) => fmMonthLabel(x.month_id)), 'Итого'],
    ...pnlKeys.map(([key, l]) => [l, ...b.pnl.rows.map((x) => r(x.values[sc]?.[key])), r(b.pnl.annual[sc][key])]),
  ]);
  const cfKeys = [['start_balance', 'Остаток на начало'], ['revenue', 'Поступления'], ['variable', 'Переменные'], ['fixed', 'Постоянные'],
    ['ano', 'АНО'], ['one_time', 'Разовые'], ['tax', 'Налог'], ['interest', 'Кредит: проценты'], ['body', 'Кредит: тело'],
    ['payout', 'Выплата'], ['net_flow', 'Чистый поток'], ['end_balance', 'Остаток на конец']] as const;
  add('Cash Flow', [
    ['Строка', ...b.cashflow.rows.map((x) => fmMonthLabel(x.month_id))],
    ...cfKeys.map(([key, l]) => [l, ...b.cashflow.rows.map((x) => r(x.values[sc]?.[key]))]),
  ]);
  add('Графики (данные)', [
    ['Месяц', 'Аванс', 'Факт', 'Маржа', 'EBITDA', 'Чистая прибыль', ...SCENARIOS.map((s) => `Остаток: ${SCENARIO_LABEL[s]}`)],
    ...b.dash.series.map((p) => [fmMonthLabel(p.month_id), r(p[sc].avans), r(p[sc].fact), r(p[sc].margin), r(p[sc].ebitda),
      r(p[sc].net_profit), ...SCENARIOS.map((s) => r(p[s].end_balance))]),
  ]);
  add('Уведомления', [
    ['Приоритет', 'Тип', 'Сообщение'],
    ...b.dash.notifications.map((n) => [n.priority === 'high' ? 'высокий' : n.priority === 'medium' ? 'средний' : 'низкий',
      NOTIF_TYPE_LABEL[n.type] || n.type, n.message]),
  ]);
  add('Источники данных', [
    ['Источник', 'Что берёт', 'Обновлено', 'Статус', 'Комментарий'],
    ...b.dash.sources.map((s) => [s.label, s.provides, s.last_updated ? new Date(s.last_updated).toLocaleDateString('ru-RU') : '—',
      SOURCE_STATUS[s.status]?.label || s.status, s.note]),
  ]);
  XLSX.writeFile(wb, `Финмодель_${SCENARIO_LABEL[sc]}_${b.dash.current_month}.xlsx`);
}

/** CSV — только помесячная сводная таблица (P&L + Cash Flow активного сценария). */
export function exportModelCsv(b: ExportBundle) {
  const sc = b.active;
  const head = ['Месяц', 'Аванс', 'Факт', 'Поступления', 'Переменные', 'Постоянные', 'АНО', 'Разовые', 'Налог',
    'Проценты', 'Тело кредита', 'Выплата', 'Чистая прибыль', 'Чистый поток', 'Остаток на конец'];
  const pnl = Object.fromEntries(b.pnl.rows.map((x) => [x.month_id, x.values[sc]]));
  const lines = b.cashflow.rows.map((x) => {
    const c = x.values[sc];
    const p = pnl[x.month_id];
    const a = b.dash.series.find((s) => s.month_id === x.month_id)?.[sc];
    return [fmMonthLabel(x.month_id), r(a?.avans), r(a?.fact), r(c.revenue), r(c.variable), r(c.fixed), r(c.ano), r(c.one_time),
      r(c.tax), r(c.interest), r(c.body), r(c.payout), r(p?.net_profit), r(c.net_flow), r(c.end_balance)].join(';');
  });
  const blob = new Blob([`\uFEFF${[head.join(';'), ...lines].join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Финмодель_${SCENARIO_LABEL[sc]}_${b.dash.current_month}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
