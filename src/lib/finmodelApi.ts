import func2url from '../../backend/func2url.json';

const API = (func2url as Record<string, string>)['finmodel'];
const PAYMENT_REPORT = (func2url as Record<string, string>)['payment-report'];

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
  const r = await fetch(API, { method: 'POST', headers: headers(true), body: JSON.stringify(body) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
};

export const fetchAvansRaw = async (): Promise<AvansData> => {
  const r = await fetch(`${API}?action=avans`, { headers: headers() });
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
  const r = await fetch(`${API}?action=fact`, { headers: headers() });
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
export type VariablePctSource = 'report' | 'override' | 'last';

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
  min: RevenueCell;
  base: RevenueCell;
  opt: RevenueCell;
}

export interface VariablePctRow {
  month_id: string;
  variable_pct: number;
  margin_pct: number | null;
  source: 'report' | 'override';
  note: string;
}

export interface RevenueData {
  acquiring_pct: number;
  active_scenario: Scenario;
  variable_pcts: VariablePctRow[];
  forecast: RevenueRow[];
  updated_at: string | null;
}

export const fetchRevenue = async (): Promise<RevenueData> => {
  const r = await fetch(`${API}?action=revenue`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

/** Переменный % месяца вручную; null — убрать ручное значение и вернуться к последнему известному. */
export const setVariablePct = (month: string, variable_pct: number | null) =>
  post({ action: 'set_variable_pct', month, variable_pct });
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
  const r = await fetch(`${API}?action=students`, { headers: headers() });
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
export type FixedCellSource = 'staff' | 'override' | 'fact' | 'forecast' | 'manual' | 'default' | 'fixed';

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
}

export interface FixedData {
  current_month: string;
  months: string[];
  closed_avans: string[];
  active_scenario: Scenario;
  rows: FixedRow[];
  totals: Record<string, FixedTotals>;
  staff: FixedStaff[];
  insurance_pct: number;
  vacation_pct: number;
  admin_shifts_default: number;
}

export const fetchFixed = async (): Promise<FixedData> => {
  const r = await fetch(`${API}?action=fixed`, { headers: headers() });
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
  const r = await fetch(`${API}?action=credit`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

export const setCreditOption = (option: CreditOption) => post({ action: 'set_credit_option', option });
