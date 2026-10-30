export interface Quarter {
  id: string;
  label: string;
  from: string;
  to: string;
  months: { id: string; label: string }[];
}

export interface KpiMetric {
  id: string;
  title: string;
  description: string;
}

// Метрики KPI администратора
export const KPI_METRICS: KpiMetric[] = [
  {
    id: 'response',
    title: 'Скорость ответа',
    description: 'Среднее время от первого сообщения родителя до ответа админа в «Окне взаимодействия»',
  },
];

export interface ResponseLevel {
  percent: number;
  label: string;
  tone: 'good' | 'mid' | 'bad';
}

// Пороги: ≤ 15 мин — 100 %, 15–30 мин — 50 %, > 30 мин — 0 %
export const RESPONSE_THRESHOLDS = [
  { range: '≤ 15 минут', percent: 100 },
  { range: '15–30 минут', percent: 50 },
  { range: '> 30 минут', percent: 0 },
];

export function responseLevel(avgMinutes: number): ResponseLevel {
  if (avgMinutes <= 15) return { percent: 100, label: '100 %', tone: 'good' };
  if (avgMinutes <= 30) return { percent: 50, label: '50 %', tone: 'mid' };
  return { percent: 0, label: '0 %', tone: 'bad' };
}

export const TONE_CLASSES: Record<ResponseLevel['tone'], string> = {
  good: 'bg-emerald-100 text-emerald-700',
  mid: 'bg-amber-100 text-amber-700',
  bad: 'bg-red-100 text-red-700',
};

export function formatMinutes(m: number): string {
  if (m < 1) return `${Math.round(m * 60)} сек`;
  if (m < 60) return `${Math.round(m * 10) / 10} мин`.replace('.', ',');
  const h = Math.floor(m / 60);
  return `${h} ч ${Math.round(m - h * 60)} мин`;
}

export interface Agg {
  dialogs: number;
  total: number;
}

export const avgOf = (a: Agg | undefined) => (a && a.dialogs > 0 ? a.total / a.dialogs : null);

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

const FIRST_YEAR = 2026;
const FIRST_Q = 4;

const pad = (n: number) => String(n).padStart(2, '0');

export function makeQuarter(year: number, q: number): Quarter {
  const m0 = (q - 1) * 3;
  const lastDay = new Date(year, m0 + 3, 0).getDate();
  return {
    id: `${year}-Q${q}`,
    label: `${q} квартал ${year} (${MONTHS_SHORT[m0]}–${MONTHS_SHORT[m0 + 2]})`,
    from: `${year}-${pad(m0 + 1)}-01`,
    to: `${year}-${pad(m0 + 3)}-${pad(lastDay)}`,
    months: [0, 1, 2].map((i) => ({ id: `${year}-${pad(m0 + i + 1)}`, label: MONTHS[m0 + i] })),
  };
}

export const FIRST_QUARTER = makeQuarter(FIRST_YEAR, FIRST_Q);

// Кварталы от октября–декабря 2026 до текущего, свежие сверху
export function quartersUntil(now: Date): Quarter[] {
  const list: Quarter[] = [];
  let y = FIRST_YEAR;
  let q = FIRST_Q;
  const curY = now.getFullYear();
  const curQ = Math.floor(now.getMonth() / 3) + 1;
  while (y < curY || (y === curY && q <= curQ)) {
    list.push(makeQuarter(y, q));
    q += 1;
    if (q > 4) { q = 1; y += 1; }
  }
  if (!list.length) list.push(FIRST_QUARTER);
  return list.reverse();
}

// Тестовые учётки в сводку не попадают
export const isTestStaff = (s: { full_name: string; job_title?: string | null }) =>
  /тест|test/i.test(`${s.full_name} ${s.job_title || ''}`);