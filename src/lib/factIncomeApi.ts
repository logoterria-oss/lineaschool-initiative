const FACT_INCOME_URL = 'https://functions.poehali.dev/8c3a18bc-8c51-47d5-ac4e-40dac4545b25';

/** Метка месяца — те же цвета, что в рабочей таблице «Факт». */
export type CellMark = '' | 'new' | 'lead' | 'vacation' | 'left';

export interface PriceItem {
  price: number;
  count: number;
}

export interface FactCell {
  month: string;
  lessons: number;
  prices: PriceItem[];
  diag_count: number;
  diag_amount: number;
  amount: number;
  mark: CellMark;
}

export interface FactRow {
  customer_id: number;
  name: string;
  crm_name: string;
  status: number | null;
  cells: FactCell[];
  total: number;
}

export interface FactTotal {
  month: string;
  total: number;
  students: number;
  new: number;
  left: number;
  avg_check: number;
  lessons: number;
}

export interface UnmatchedDiag {
  month: string;
  name: string;
  amount: number;
}

export interface FactIncomeData {
  year: number;
  months: string[];
  rows: FactRow[];
  totals: FactTotal[];
  unmatched_diag: UnmatchedDiag[];
}

export const fetchFactIncome = async (
  year: number,
  refresh = false,
): Promise<FactIncomeData> => {
  const url = `${FACT_INCOME_URL}?year=${year}${refresh ? '&refresh=1' : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Не удалось загрузить отчёт');
  return res.json();
};

const MONTH_SHORT: Record<string, string> = {
  '01': 'январь', '02': 'февраль', '03': 'март', '04': 'апрель',
  '05': 'май', '06': 'июнь', '07': 'июль', '08': 'август',
  '09': 'сентябрь', '10': 'октябрь', '11': 'ноябрь', '12': 'декабрь',
};

export const monthLabel = (month: string) => MONTH_SHORT[month.slice(5)] || month;

export const formatMoney = (n: number) =>
  n ? n.toLocaleString('ru-RU') : '';

/** «8 × 1370» или «1 × 1290 + 12 × 1180», если цена в месяце менялась. */
export const priceLabel = (cell: FactCell) => {
  const parts: string[] = [];
  if (cell.diag_amount) parts.push(String(cell.diag_amount));
  cell.prices.forEach((p) => parts.push(String(p.price)));
  return parts.join(' · ');
};

export const countLabel = (cell: FactCell) => {
  const parts: string[] = [];
  if (cell.diag_amount) parts.push(String(cell.diag_count || 1));
  cell.prices.forEach((p) => parts.push(String(p.count)));
  return parts.join(' · ');
};

/** Цвета меток повторяют заливку в excel-таблице, чтобы читалось привычно. */
export const MARK_STYLE: Record<CellMark, string> = {
  '': '',
  new: 'bg-green-100',
  lead: 'bg-yellow-100',
  vacation: 'bg-sky-100',
  left: 'bg-red-100',
};

export const MARK_LABEL: Record<Exclude<CellMark, ''>, string> = {
  new: 'Новый ученик — купил первый абонемент',
  lead: 'Лид — прошёл диагностику, абонемент не купил',
  vacation: 'Весь месяц не занимался (каникулы/пауза)',
  left: 'Последний месяц занятий — ушёл',
};
