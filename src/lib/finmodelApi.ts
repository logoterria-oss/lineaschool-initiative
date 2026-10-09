import func2url from '../../backend/func2url.json';

const API = (func2url as Record<string, string>)['finmodel'];
const PAYMENT_REPORT = (func2url as Record<string, string>)['payment-report'];

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/** Запрос к финмодели с повтором: при перегрузке базы (5xx / обрыв сети) ждём и пробуем снова. */
const fmFetch = async (url: string, init?: RequestInit): Promise<Response> => {
  const delays = [1500, 3000, 5000];
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, init);
      if (r.status < 500 || i >= delays.length) return r;
    } catch (e) {
      if (i >= delays.length) throw e;
    }
    await sleep(delays[i]);
  }
};

export type Scenario = 'min' | 'base' | 'opt';
export const SCENARIOS: Scenario[] = ['min', 'base', 'opt'];
export const SCENARIO_LABEL: Record<Scenario, string> = {
  min: 'Минимальный',
  base: 'Базовый',
  opt: 'Оптимистичный',
};

export interface AvansHistoryRow {
  month_id: string;
  avans: number;
  source: 'report' | 'manual';
  closed: boolean;
  closed_at: string | null;
  exclude_from_seasonality: boolean;
  note: string;
}

export interface SeasonalityRow {
  month_num: number;
  share_pct: number;
  avans: number;
  updated_at: string;
  source_period: string;
}

export interface AvansForecastCell {
  coef: number;
  forecast_direct: number | null;
  forecast_seasonal: number;
  diff_pct: number | null;
  forecast_final: number;
  calculated_at: string;
}

export interface AvansForecastRow {
  month_id: string;
  avans_prev_year: number | null;
  min: AvansForecastCell;
  base: AvansForecastCell;
  opt: AvansForecastCell;
}

export interface AvansData {
  today: string;
  current_month: string;
  history: AvansHistoryRow[];
  seasonality: SeasonalityRow[];
  seasonality_total_pct: number;
  forecast: AvansForecastRow[];
  active_scenario: Scenario;
  coefs: Record<Scenario, number>;
  threshold_pct: number;
  seasonality_method: string;
  to_close: string[];
  updated_at: string | null;
}

const headers = (json = false): Record<string, string> => {
  const h: Record<string, string> = {};
  const token = localStorage.getItem('staff_token') || '';
  if (token) h['X-Auth-Token'] = token;
  if (json) h['Content-Type'] = 'application/json';
  return h;
};

const post = async (body: Record<string, unknown>) => {
  const r = await fmFetch(API, { method: 'POST', headers: headers(true), body: JSON.stringify(body) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
};

export const fetchAvansRaw = async (): Promise<AvansData> => {
  const r = await fmFetch(`${API}?action=avans`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

/** Сумма авансов за месяц — из существующего отчёта «Авансовые доходы». */
const fetchAvansFromReport = async (month: string): Promise<number> => {
  const r = await fetch(`${PAYMENT_REPORT}?month=${month}&type=all`);
  const data = await r.json();
  const v = data?.stats?.total_revenue;
  if (typeof v !== 'number') throw new Error('Отчёт «Авансовые доходы» не ответил');
  return v;
};

/**
 * Загрузка модуля авансов. Если с 1-го числа появились незакрытые прошедшие
 * месяцы — забираем их сумму из отчёта «Авансовые доходы», закрываем и
 * получаем уже пересчитанные сезонность и прогноз.
 */
export const fetchAvans = async (): Promise<AvansData> => {
  let data = await fetchAvansRaw();
  if (data.to_close.length === 0) return data;
  for (const month of data.to_close) {
    const avans = await fetchAvansFromReport(month);
    await post({ action: 'avans_close', month, avans });
  }
  data = await fetchAvansRaw();
  return data;
};

export const setActiveScenario = (scenario: Scenario) => post({ action: 'set_scenario', scenario });

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
export const fmMonthLabel = (m: string) => `${MONTHS[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`;
export const fmMoney = (v: number | null | undefined) =>
  v == null ? '—' : `${Math.round(v).toLocaleString('ru-RU')} ₽`;
export const fmPct = (v: number | null | undefined, d = 2) =>
  v == null ? '—' : `${Number(v).toFixed(d).replace('.', ',')}%`;

// ---------------- Фактические доходы ----------------
const FACT_INCOME = (func2url as Record<string, string>)['fact-income'];

export interface FactHistoryRow {
  month_id: string;
  fact: number;
  avans: number | null;
  source: 'report' | 'manual';
  closed: boolean;
  closed_at: string | null;
  exclude_from_seasonality: boolean;
  note: string;
}

export interface FactSeasonalityRow {
  month_num: number;
  share_pct: number;
  avans_share_pct: number | null;
  fact: number;
  source_period: string;
}

export interface FactCoefRow {
  month_num: number;
  coef: number;
  fact: number;
  avans: number;
  source_period: string;
}

export interface FactForecastCell {
  avans_forecast: number;
  coef: number;
  fact_direct: number;
  fact_seasonal: number;
  diff_pct: number;
  fact_final: number;
}

export interface FactForecastRow {
  month_id: string;
  fact_prev_year: number | null;
  coef: number;
  min: FactForecastCell;
  base: FactForecastCell;
  opt: FactForecastCell;
}

export interface FactData {
  current_month: string;
  history: FactHistoryRow[];
  seasonality: FactSeasonalityRow[];
  seasonality_total_pct: number;
  coefs: FactCoefRow[];
  forecast: FactForecastRow[];
  active_scenario: Scenario;
  growth_coefs: Record<Scenario, number>;
  threshold_pct: number;
  to_close: string[];
  updated_at: string | null;
}

export const fetchFactRaw = async (): Promise<FactData> => {
  const r = await fmFetch(`${API}?action=fact`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

/** Факт за месяц — из существующего отчёта «Фактические доходы». */
const fetchFactFromReport = async (month: string): Promise<number> => {
  const r = await fetch(`${FACT_INCOME}?month=${month}`);
  const data = await r.json();
  const v = data?.totals?.[0]?.total;
  if (typeof v !== 'number') throw new Error('Отчёт «Фактические доходы» не ответил');
  return v;
};

/**
 * Загрузка модуля факта. Вызывать после fetchAvans: прогноз факта строится
 * от прогноза авансов. Незакрытые прошедшие месяцы забираем из отчёта
 * «Фактические доходы» и закрываем — после этого пересчёт идёт на сервере.
 */
export const fetchFact = async (): Promise<FactData> => {
  const data = await fetchFactRaw();
  if (data.to_close.length === 0) return data;
  for (const month of data.to_close) {
    const fact = await fetchFactFromReport(month);
    await post({ action: 'fact_close', month, fact });
  }
  return fetchFactRaw();
};

export const MONTH_NUM_LABEL = MONTHS;
export const fmCoef = (v: number | null | undefined, d = 2) =>
  v == null ? '—' : Number(v).toFixed(d).replace('.', ',');

// ---------------- Поступления и переменные ----------------
export type VariablePctSource = 'report' | 'override' | 'last' | 'current';

export interface RevenueCell {
  avans: number;
  fact: number;
  revenue: number;
  variable_pct: number;
  variable_amount: number;
  margin_amount: number;
}

export interface RevenueRow {
  month_id: string;
  variable_pct: number;
  variable_pct_source: VariablePctSource;
  /** Прошедший месяц: закрытые аванс и факт, а не прогноз. */
  is_actual?: boolean;
  min: RevenueCell;
  base: RevenueCell;
  opt: RevenueCell;
}

export interface VariablePctRow {
  month_id: string;
  variable_pct: number;
  margin_pct: number | null;
  source: 'report' | 'override' | 'current';
  note: string;
}

export interface RevenueData {
  acquiring_pct: number;
  active_scenario: Scenario;
  variable_pcts: VariablePctRow[];
  /** Прошедшие месяцы с сентября 2026 — факт. */
  actuals?: RevenueRow[];
  current_month?: string;
  forecast: RevenueRow[];
  updated_at: string | null;
}

export const fetchRevenue = async (): Promise<RevenueData> => {
  const r = await fmFetch(`${API}?action=revenue`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

/** Переменный % месяца вручную; null — убрать ручное значение и вернуться к последнему известному. */
export const setVariablePct = (month: string, variable_pct: number | null) =>
  post({ action: 'set_variable_pct', month, variable_pct });

/** Маржинальность идущего месяца из отчёта «Маржинальность урока» (считается тем же кодом, что и отчёт). */
export const setCurrentMargin = (month: string, margin_pct: number) =>
  post({ action: 'set_current_margin', month, margin_pct });
// ---------------- Ученики и занятия (справочно) ----------------

export type StudentsSource = 'alfa' | 'report' | 'manual';

export interface StudentsRow {
  month_id: string;
  active_students: number | null;
  total_lessons: number | null;
  avg_lessons_per_student: number | null;
  avg_group_fill: number | null;
  source: StudentsSource;
  lessons_source: 'report' | 'manual';
  closed: boolean;
  note: string;
  updated_at: string | null;
  state: 'closed' | 'open' | 'current';
  report_complete: boolean;
  has_report?: boolean;
}

export interface StudentsData {
  current_month: string;
  rows: StudentsRow[];
  alfa_connection: 'not_needed' | 'connected';
}

export const fetchStudents = async (): Promise<StudentsData> => {
  const r = await fmFetch(`${API}?action=students`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

/** Закрыть прошедший месяц цифрами отчётов. */
export const closeStudents = (month: string) => post({ action: 'close_students', month });

/** Ввести месяц вручную (сразу закрывается). */
export const setStudents = (
  month: string,
  v: { active_students: number; total_lessons: number; avg_group_fill: number | null },
) => post({ action: 'set_students', month, ...v });

// ---------------- Постоянные расходы ----------------
export type FixedSource = 'staff' | 'calc' | 'fixed' | 'manual';
export type FixedCellSource = 'staff' | 'override' | 'fact' | 'forecast' | 'manual' | 'default' | 'fixed' | 'adapted' | 'inactive' | 'changed';

export interface FixedRow {
  key: string;
  name: string;
  source: FixedSource;
  group: 'staff' | 'items';
  note: string;
  editable: boolean;
  values: Record<string, Record<Scenario, number>>;
  sources: Record<string, FixedCellSource>;
  notes: Record<string, string>;
  inputs?: Record<string, { rate: number; shifts: number }>;
  staff_id?: string;
}

export interface FixedTotals {
  total: Record<Scenario, number>;
  total_wo_designers: Record<Scenario, number>;
  ano: number;
  total_with_ano: Record<Scenario, number>;
}

export interface FixedStaff {
  id: string;
  name: string;
  role: string;
  type: string;
  rate: number | null;
  rate_unit: string | null;
  rate_max: number | null;
  insurance_applies: boolean;
  vacation_applies: boolean;
  bonus_pct: number | null;
  substitution_rate: number | null;
  active_from: string | null;
  active_to: string | null;
  is_custom: boolean;
}

export interface FixedItem {
  id: string;
  name: string;
  amount: number | null;
  amount_unit: string;
  is_fixed: boolean;
  is_custom: boolean;
  active_from: string | null;
  active_to: string | null;
}

export interface CostChange {
  id: number;
  kind: 'staff' | 'item';
  target_id: string;
  from_month: string;
  amount: number;
  shifts: number | null;
  note: string;
}

export interface FixedActualLine {
  id: number;
  name: string;
  group: 'staff' | 'items';
  source_key: string | null;
  values: Record<string, number>;
}

export interface FixedActuals {
  months: string[];
  lines: FixedActualLine[];
  totals: Record<string, number>;
  designers: Record<string, number>;
}

export interface FixedData {
  current_month: string;
  months: string[];
  closed_avans: string[];
  active_scenario: Scenario;
  rows: FixedRow[];
  totals: Record<string, FixedTotals>;
  staff: FixedStaff[];
  items: FixedItem[];
  actuals: FixedActuals;
  cost_changes: CostChange[];
  admin_rate_default: number;
  insurance_pct: number;
  vacation_pct: number;
  admin_shifts_default: number;
}

export const fetchFixed = async (): Promise<FixedData> => {
  const r = await fmFetch(`${API}?action=fixed`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

/** Ручная сумма статьи за месяц; null — вернуть значение по умолчанию. */
export const setFixedExpense = (month: string, expense_id: string, amount: number | null) =>
  post({ action: 'set_fixed_expense', month, expense_id, amount });

/** Замены РУО (уроков), смены и ставка админов за месяц; null — по умолчанию. */
export const setMonthInputs = (
  month: string,
  v: { ruo_replacements?: number | null; admin_shifts_override?: number | null; admin_rate_override?: number | null },
) => post({ action: 'set_month_inputs', month, ...v });

/** Таблица факта постоянных расходов за прошедшие месяцы. */
export type FixedActualOp =
  | { op: 'set'; line_id: number; month: string; amount: number | null }
  | { op: 'add_line'; name: string; group: 'staff' | 'items' }
  | { op: 'rename'; line_id: number; name: string }
  | { op: 'delete_line'; line_id: number };
export const fixedActual = (v: FixedActualOp) => post({ action: 'fixed_actual', ...v });

/** Конструктор прогноза: сотрудники и статьи с периодом действия. */
export interface FixedModelOp {
  op: 'staff_add' | 'staff_update' | 'staff_delete' | 'item_add' | 'item_update' | 'item_delete' | 'change_set' | 'change_delete';
  id?: string;
  kind?: 'staff' | 'item';
  target_id?: string;
  from_month?: string;
  shifts?: number | null;
  note?: string;
  change_id?: number;
  name?: string;
  type?: string;
  rate?: number;
  amount?: number;
  active_from?: string | null;
  active_to?: string | null;
}
export const fixedModel = (v: FixedModelOp) => post({ action: 'fixed_model', ...v });

/** Ставка сотрудника в справочнике (для админов — сразу у всех). */
export const setStaffRate = (staff_id: string, rate: number) => post({ action: 'set_staff_rate', staff_id, rate });

/** Разовая ставка сотрудника на месяц; null — по справочнику. */
export const setStaffMonthRate = (staff_id: string, month: string, rate: number | null) =>
  post({ action: 'set_staff_month_rate', staff_id, month, rate });

// ---------------- КРЕДИТ ----------------
export type CreditOption = '6m' | '12m';

export interface CreditRow {
  month_id: string;
  interest: number;
  body: number;
  total: number;
  balance_after: number;
  status: 'active' | 'closed';
  is_last: boolean;
}

export interface CreditSummary {
  interest: number;
  body: number;
  total: number;
  monthly: number;
  months: number;
  close_month: string | null;
}

export interface CreditData {
  current_month: string;
  option: CreditOption;
  params: {
    total: number;
    interest_monthly: number;
    rate_pct: number;
    body_6m: number;
    body_12m: number;
    start_month: string;
    contract: string;
  };
  penalty_risk: { amount: number; fee: number; pct_part: number; period_days: number };
  schedules: Record<CreditOption, CreditRow[]>;
  summary: Record<CreditOption, CreditSummary>;
  diff: { interest: number; total: number; monthly: number };
}

export const fetchCredit = async (): Promise<CreditData> => {
  const r = await fmFetch(`${API}?action=credit`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

export const setCreditOption = (option: CreditOption) => post({ action: 'set_credit_option', option });

// ---------------- АНО ----------------
export interface AnoRow {
  month_id: string;
  one_time: number;
  one_time_schedule: number;
  extra_one_time: number;
  monthly: number;
  monthly_schedule: number;
  total: number;
  source: 'schedule' | 'manual';
  note: string;
}

export interface AnoData {
  current_month: string;
  include_in_model: boolean;
  params: { one_time_total: number; one_time_sep: number; one_time_oct: number; monthly: number; start_monthly: string };
  rows: AnoRow[];
  summary: { period: [string, string] | null; one_time: number; monthly: number; total: number; monthly_count: number };
}

export const fetchAno = async (): Promise<AnoData> => {
  const r = await fmFetch(`${API}?action=ano`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

/** monthly: null — вернуть по графику; extra: доп. разовая сумма (0 — убрать). */
export const setAno = (month: string, v: { monthly?: number | null; extra?: number | null; note?: string }) =>
  post({ action: 'set_ano', month, ...v });

// ---------------- НАЛОГИ ----------------
export type TaxRegime = 'usn' | 'patent';

export interface TaxCell {
  base: number;
  tax_gross: number;
  tax_net: number;
  reduction: number;
  limited: boolean;
  social_fund: number;
  sf_employees: number;
  sf_self: number;
}

export interface TaxRow {
  month_id: string;
  regime: TaxRegime;
  regime_default: TaxRegime;
  source: 'calculated' | 'override';
  avans_source: 'fact' | 'forecast';
  values: Record<Scenario, TaxCell>;
}

export interface TaxData {
  current_month: string;
  rows: TaxRow[];
  params: {
    usn_pct: number;
    patent_year: number;
    patent_monthly: number;
    self_year: number;
    self_monthly: number;
    max_deduction_pct: number;
    start_patent_month: string;
    patent_schedule: string;
  };
  compare: Record<Scenario, { usn: number; patent: number }>;
  compare_months: [string, string] | null;
}

export const fetchTaxes = async (): Promise<TaxData> => {
  const r = await fmFetch(`${API}?action=taxes`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

/** Режим налога на месяц; null — по умолчанию (УСН до перехода, патент после). */
export const setTaxRegime = (month: string, regime: TaxRegime | null) =>
  post({ action: 'set_tax_regime', month, regime });

// ---------------- ВЫПЛАТА СОБСТВЕННИКУ ----------------
export interface PayoutCell {
  avans: number;
  revenue: number;
  payout_amount: number;
  payout_final: number;
}

export interface PayoutRow {
  month_id: string;
  payout_pct: number;
  pct_source: 'default' | 'manual';
  payout_manual: number | null;
  values: Record<Scenario, PayoutCell>;
}

export interface PayoutSummary {
  avans: number;
  revenue: number;
  payout: number;
  avg: number;
  max: { month_id: string; amount: number };
  min: { month_id: string; amount: number };
  gap_monthly: number;
  gap_year: number;
  pct_needed: number | null;
  revenue_needed_monthly: number | null;
}

export interface PayoutData {
  current_month: string;
  acquiring_pct: number;
  default_pct: number;
  target_monthly: number;
  rows: PayoutRow[];
  summary: Record<Scenario, PayoutSummary>;
}

export const fetchPayouts = async (): Promise<PayoutData> => {
  const r = await fmFetch(`${API}?action=payouts`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

/** Процент и/или ручная сумма выплаты за месяц; null — по умолчанию. */
export const setPayout = (month: string, v: { payout_pct?: number | null; payout_manual?: number | null }) =>
  post({ action: 'set_payout', month, ...v });

// ---------------- РАЗОВЫЕ РАСХОДЫ ----------------
export interface OneTimeCategory {
  id: string;
  label: string;
}

export interface OneTimeItem {
  id: number;
  month_id: string;
  name: string;
  amount: number;
  category: string;
  comment: string;
  source: 'manual';
  created_at: string;
  updated_at: string;
}

export interface OneTimeData {
  current_month: string;
  categories: OneTimeCategory[];
  items: OneTimeItem[];
  months: string[];
  by_month: Record<string, number>;
}

export interface OneTimeInput {
  id?: number;
  month_id: string;
  name: string;
  amount: number;
  category: string;
  comment: string;
}

export const fetchOneTime = async (): Promise<OneTimeData> => {
  const r = await fmFetch(`${API}?action=one_time`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

export const saveOneTime = (v: OneTimeInput) => post({ action: 'save_one_time', ...v });
export const deleteOneTime = (id: number) => post({ action: 'delete_one_time', id });

// ---------------- P&L ----------------
export const PNL_KEYS = [
  'revenue', 'variable', 'gross_profit', 'fixed', 'ano', 'one_time', 'ebitda', 'interest', 'tax', 'net_profit',
] as const;
export type PnlKey = (typeof PNL_KEYS)[number];
export type PnlValues = Record<PnlKey, number>;

export interface PnlRow {
  month_id: string;
  variable_pct: number;
  tax_regime: TaxRegime | null;
  values: Record<Scenario, PnlValues>;
}

export interface PnlData {
  current_month: string;
  active_scenario: Scenario;
  credit_option: CreditOption;
  rows: PnlRow[];
  annual: Record<Scenario, PnlValues>;
}

export const fetchPnl = async (): Promise<PnlData> => {
  const r = await fmFetch(`${API}?action=pnl`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

// ---------------- CASH FLOW ----------------
export const CF_OUT_KEYS = ['variable', 'fixed', 'ano', 'one_time', 'tax', 'interest', 'body', 'payout'] as const;
export type CfOutKey = (typeof CF_OUT_KEYS)[number];

export type CfValues = Record<CfOutKey, number> & {
  start_balance: number;
  revenue: number;
  other: number;
  outflow: number;
  net_flow: number;
  end_balance: number;
};

export type CfSource = 'fact' | 'partial' | 'forecast';

export interface CfBankFact {
  ops: number;
  uncategorized: number;
}

export interface CfRow {
  month_id: string;
  tax_regime: TaxRegime | null;
  source?: CfSource;
  bank?: CfBankFact | null;
  values: Record<Scenario, CfValues>;
}

export type CfSummary = Record<CfOutKey, number> & {
  start_balance: number;
  end_balance: number;
  min_balance: number | null;
  min_month: string | null;
  gap_months: string[];
  first_gap_month: string | null;
  total_outflow: number;
  revenue: number;
  other: number;
  net_flow: number;
};

export interface CashflowData {
  current_month: string;
  active_scenario: Scenario;
  credit_option: CreditOption;
  start_balance: {
    total: number;
    tbank: number | null;
    lokobank: number | null;
    date: string | null;
    source?: 'bank' | 'manual' | 'constants';
    tbank_source?: 'bank' | 'constants';
    lokobank_source?: 'bank' | 'constants';
    model_total?: number;
  };
  fact_from?: string;
  rows: CfRow[];
  summary: Record<Scenario, CfSummary>;
}

export const fetchCashflow = async (): Promise<CashflowData> => {
  const r = await fmFetch(`${API}?action=cashflow`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

// ---------------- АДАПТАЦИЯ (Промт 13) ----------------
export type AdaptMetric = 'avans' | 'fact' | 'variable_pct' | 'fixed_expense' | 'new_item';
export const ADAPT_METRIC_LABEL: Record<AdaptMetric, string> = {
  avans: 'Аванс',
  fact: 'Факт',
  variable_pct: 'Переменный %',
  fixed_expense: 'Постоянная статья',
  new_item: 'Новая статья',
};

export interface AdaptLogRow {
  id: number;
  month_id: string;
  metric: AdaptMetric;
  item_id: string;
  item_name: string;
  scenario: Scenario;
  forecast: number;
  actual: number;
  deviation: number;
  deviation_pct: number | null;
  correction: number;
  applied_to: string;
  k_coef: number;
  status: 'applied' | 'skipped' | 'cancelled';
  source: 'auto' | 'manual';
  note: string;
  created_at: string;
  cancelled_at: string | null;
}

export interface AdaptPoint {
  month_id: string;
  forecast?: number | null;
  actual?: number;
  deviation_pct?: number | null;
  model?: number;
  corrected?: number;
  correction?: number;
  own?: boolean;
}

export type AdaptAlert =
  | { type: 'big_deviation'; log_id: number; month_id: string; metric: AdaptMetric; item_id: string; deviation: number; deviation_pct: number }
  | { type: 'systematic'; log_id: number; month_id: string; item_id: string; item_name: string; suggested: number }
  | { type: 'new_item'; item_id: string; item_name: string; months_done: number; amount: number }
  | { type: 'new_item_average'; item_id: string; item_name: string; suggested: number; months: number };

export interface AdaptParams {
  k: number;
  systematic_months: number;
  min_deviation_pct: number;
  min_deviation_pp: number;
  alert_pct: number;
}

export interface AdaptationData {
  current_month: string;
  active_scenario: Scenario;
  params: AdaptParams;
  log: AdaptLogRow[];
  series: Record<'avans' | 'fact' | 'variable_pct', AdaptPoint[]>;
  alerts: AdaptAlert[];
  items: { id: string; name: string; amount: number; new_since: string | null }[];
}

export const fetchAdaptation = async (): Promise<AdaptationData> => {
  const r = await fmFetch(`${API}?action=adaptation`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

export const setAdaptParams = (v: Partial<AdaptParams> & { reapply?: boolean }) =>
  post({ action: 'set_adapt_params', ...v });
export const cancelAdaptation = (id: number, restore = false) => post({ action: 'cancel_adaptation', id, restore });
export const adaptManual = (v: { month: string; metric: 'avans' | 'fact' | 'variable_pct'; forecast: number; actual: number; force?: boolean }) =>
  post({ action: 'adapt_manual', ...v });
export const adaptNewItem = (v: { month: string; amount: number; name?: string; item_id?: string }) =>
  post({ action: 'adapt_new_item', ...v });
export const adaptSetBase = (item_id: string, amount: number) => post({ action: 'adapt_set_base', item_id, amount });

// ---------------- СЦЕНАРИИ И ЧУВСТВИТЕЛЬНОСТЬ (Промт 14) ----------------
export interface ScenarioDef {
  id: string;
  name: string;
  growth_coef: number;
  price_change_pct: number;
  students_override: number | null;
  advertising_override: number | null;
  staff_changes: { teachers?: number };
  credit_option: CreditOption | null;
  payout_pct: number | null;
  is_default: boolean;
  is_builtin: boolean;
  note: string;
}

export interface ScenarioMonth {
  month_id: string;
  avans: number;
  fact: number;
  revenue: number;
  variable: number;
  gross_profit: number;
  fixed: number;
  ano: number;
  one_time: number;
  ebitda: number;
  interest: number;
  tax: number;
  net_profit: number;
  payout: number;
  body: number;
  net_flow: number;
  end_balance: number;
}

export type ScenarioAnnual = Omit<ScenarioMonth, 'month_id'> & {
  min_balance: number | null;
  min_month: string | null;
  gap_months: string[];
  credit_option: CreditOption;
};

export type SensParam = 'price' | 'students' | 'advertising' | 'staff';
export interface SensPoint {
  value: number;
  net_profit: number;
  end_balance: number;
  ebitda: number;
  min_balance: number | null;
}

export interface ScenariosData {
  current_month: string;
  active_scenario: Scenario;
  months: string[];
  scenarios: ScenarioDef[];
  results: Record<string, { annual: ScenarioAnnual; monthly: ScenarioMonth[] }>;
  sensitivity: Record<SensParam, { values: number[]; results: Record<Scenario, SensPoint[]> }>;
  base_params: {
    price: number;
    students: number;
    teacher_cost: number;
    advertising: number;
    credit_option: CreditOption;
    payout_pct: number;
    near_zero: number;
  };
  check: Record<Scenario, { cashflow_end_balance: number; model_end_balance: number; diff: number }>;
}

export const fetchScenarios = async (): Promise<ScenariosData> => {
  const r = await fmFetch(`${API}?action=scenarios`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

export type ScenarioInput = Partial<Omit<ScenarioDef, 'is_default' | 'is_builtin'>> & { name: string };
export const saveScenario = (v: ScenarioInput) => post({ action: 'save_scenario', ...v });
export const deleteScenario = (id: string) => post({ action: 'delete_scenario', id });

// ---------------- ДАШБОРД И УВЕДОМЛЕНИЯ (Промт 15) ----------------
export type TaxRegimeGlobal = 'auto' | TaxRegime;
export type NotifPriority = 'high' | 'medium' | 'low';

export interface FmNotification {
  id: number;
  key: string;
  type: string;
  priority: NotifPriority;
  message: string;
  action_url: string;
  created_at: string;
  updated_at: string;
  read_at: string | null;
  snoozed_until: string | null;
}

export interface DataSource {
  source: string;
  label: string;
  provides: string;
  last_updated: string | null;
  status: 'ok' | 'stale' | 'missing' | 'manual';
  note: string;
}

export interface DashKpi {
  avans: number;
  fact: number;
  revenue: number;
  margin: number;
  net_profit: number;
  payout: number;
  end_balance: number;
  min_balance: number;
  min_month: string | null;
  gap_months: string[];
}

export interface DashPoint {
  avans: number;
  fact: number;
  margin: number;
  end_balance: number | null;
  revenue_pnl: number;
  gross_profit: number;
  ebitda: number;
  net_profit: number;
}

export interface DashboardData {
  last_updated: string | null;
  current_month: string;
  prev_month: string;
  active_scenario: Scenario;
  tax_regime: TaxRegimeGlobal;
  tax_regime_now: TaxRegime;
  start_patent_month: string;
  credit_option: CreditOption;
  credit: CreditSummary & { option: CreditOption };
  months: string[];
  kpi: Record<Scenario, DashKpi>;
  series: ({ month_id: string } & Record<Scenario, DashPoint>)[];
  expenses: { key: CfOutKey; value: number }[];
  start_balance: { total: number; tbank: number; lokobank: number; date: string | null };
  manual: {
    expenses: { month_id: string; expense_id: string; amount: number; name: string }[];
    inputs: {
      month_id: string;
      ruo_replacements: number | null;
      admin_shifts_override: number | null;
      admin_rate_override: number | null;
      payout_pct_override: number | null;
      payout_manual: number | null;
      tax_regime_override: TaxRegime | null;
    }[];
    variable_pct: { month_id: string; variable_pct: number }[];
    staff: { staff_id: string; month_id: string; rate_override: number; name: string }[];
    items: { id: string; name: string; amount: number }[];
  };
  sources: DataSource[];
  notifications: FmNotification[];
  hidden_notifications: number;
  to_close: { avans: string[]; fact: string[] };
  near_zero: number;
}

export const fetchDashboard = async (): Promise<DashboardData> => {
  const r = await fmFetch(`${API}?action=dashboard`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

export const notificationAction = (op: 'dismiss' | 'snooze' | 'read' | 'restore', id?: number) =>
  post({ action: 'notification', op, id });
export const setTaxRegimeGlobal = (regime: TaxRegimeGlobal) => post({ action: 'set_tax_regime_global', regime });
export const closeStudentsPrev = () => post({ action: 'close_students_prev' });
export const recalcModel = () => post({ action: 'recalc' });
