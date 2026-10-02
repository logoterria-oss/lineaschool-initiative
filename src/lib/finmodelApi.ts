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
