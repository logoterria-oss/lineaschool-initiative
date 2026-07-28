import { Lead } from '@/lib/leadsApi';

export const EMPTY: Partial<Lead> = {
  parent_name: '', student_name: '', student_age: '', contact: '',
  request_date: '', responsible: '', processing_status: '', lead_status: '',
  diag_date: '', report_link: '', schedule: '', teachers: '', comment: '',
  contact_when: '',
};

// Лид считается "новым/необработанным" (подсветить красным),
// если по нему ещё не было взаимодействий: не назначен ответственный,
// не выставлен статус обработки и статус лида.
export function isUntouched(l: Lead): boolean {
  return !l.responsible?.trim() && !l.processing_status?.trim() && !l.lead_status?.trim();
}

// Дата заявки хранится текстом: «ДД.ММ» или «ДД.ММ.ГГГГ» (иногда через «/»).
// Превращаем в число ГГГГММДД для сортировки. Год берём текущий, если не указан.
// Лиды без даты уходят вниз.
export function requestDateSortKey(raw: string | undefined): number {
  const s = (raw || '').trim().replace(/\//g, '.');
  const m = s.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/);
  if (!m) return -1;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  let year = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
  if (year < 100) year += 2000;
  if (!month || !day) return -1;
  return year * 10000 + month * 100 + day;
}

// ISO-дата из input[type=date] («ГГГГ-ММ-ДД») → число ГГГГММДД. Пусто → 0.
export function isoToSortKey(iso: string): number {
  const m = (iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 10000 + parseInt(m[2], 10) * 100 + parseInt(m[3], 10);
}

const MONTH_NAMES: Record<string, number> = {
  январ: 1, феврал: 2, март: 3, апрел: 4, мая: 5, май: 5, июн: 6, июл: 7,
  август: 8, сентябр: 9, октябр: 10, ноябр: 11, декабр: 12,
};

function todayKey(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// Статусы лида, при которых связываться уже не нужно (лид «закрыт»).
const CLOSED_LEAD_STATUSES = new Set([
  'клиент', 'нецелевой лид', 'лид не вышел на связь', 'норма развития', 'отказ', 'игнор',
]);

function mkKey(day: number, month: number, year: number): number {
  return year * 10000 + month * 100 + day;
}

// Разбирает «Когда связаться» в окно [start, end] (ГГГГММДД).
// Поддержка: точная дата ДД.ММ[.ГГГГ]; диапазон ДД.ММ-ДД.ММ;
// «в начале/середине/конце месяца [название]».
function contactWhenWindow(raw: string | undefined): { start: number; end: number } | null {
  const s = (raw || '').trim().toLowerCase();
  if (!s) return null;
  const year = new Date().getFullYear();

  // Найдём месяц по названию, если он есть в тексте
  let namedMonth = 0;
  for (const [k, v] of Object.entries(MONTH_NAMES)) {
    if (s.includes(k)) { namedMonth = v; break; }
  }
  const curMonth = new Date().getMonth() + 1;
  const month = namedMonth || curMonth;

  if (/начал/.test(s)) return { start: mkKey(1, month, year), end: mkKey(10, month, year) };
  if (/серед/.test(s)) return { start: mkKey(11, month, year), end: mkKey(20, month, year) };
  if (/конц|конце|конца/.test(s)) return { start: mkKey(21, month, year), end: mkKey(31, month, year) };

  const norm = s.replace(/\//g, '.');
  const dates = [...norm.matchAll(/(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/g)].map((m) => {
    let y = m[3] ? parseInt(m[3], 10) : year;
    if (y < 100) y += 2000;
    return mkKey(parseInt(m[1], 10), parseInt(m[2], 10), y);
  });
  if (dates.length >= 2) return { start: Math.min(dates[0], dates[1]), end: Math.max(dates[0], dates[1]) };
  if (dates.length === 1) return { start: dates[0], end: dates[0] };
  return null;
}

// Пора связаться / просрочено: срок наступил (сегодня >= начала окна),
// а лид ещё не закрыт по статусу.
export function isContactDue(l: Lead): boolean {
  if (CLOSED_LEAD_STATUSES.has((l.lead_status || '').trim())) return false;
  const w = contactWhenWindow(l.contact_when);
  if (!w) return false;
  return todayKey() >= w.start;
}

export function isContactOverdue(l: Lead): boolean {
  if (CLOSED_LEAD_STATUSES.has((l.lead_status || '').trim())) return false;
  const w = contactWhenWindow(l.contact_when);
  if (!w) return false;
  return todayKey() > w.end;
}

export const COLS: { key: keyof Lead; label: string; w: string }[] = [
  { key: 'parent_name', label: 'ФИ родителя', w: 'min-w-[210px]' },
  { key: 'student_name', label: 'ФИ ученика', w: 'min-w-[210px]' },
  { key: 'student_age', label: 'Возраст', w: 'w-16' },
  { key: 'contact', label: 'Номер для связи', w: 'min-w-[170px]' },
  { key: 'request_date', label: 'Дата заявки', w: 'w-24' },
  { key: 'responsible', label: 'Ответственный', w: 'min-w-[170px]' },
  { key: 'processing_status', label: 'Статус обработки', w: 'min-w-[230px]' },
  { key: 'lead_status', label: 'Статус лида', w: 'min-w-[170px]' },
  { key: 'diag_date', label: 'Дата диаг.', w: 'w-24' },
  { key: 'report_link', label: 'Ссылка на закл.', w: 'min-w-[180px]' },
  { key: 'schedule', label: 'Расписание', w: 'min-w-[160px]' },
  { key: 'teachers', label: 'Педагоги', w: 'min-w-[140px]' },
  { key: 'comment', label: 'Комментарий', w: 'min-w-[240px]' },
  { key: 'contact_when', label: 'Когда связаться', w: 'min-w-[190px]' },
];
