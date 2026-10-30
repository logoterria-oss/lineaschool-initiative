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
  maxPoints: number;
}

// Метрики KPI администратора. Заполняются, когда утверждены критерии оценки.
export const KPI_METRICS: KpiMetric[] = [];

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
