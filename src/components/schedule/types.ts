export const S20_URL = 'https://functions.poehali.dev/6d9e6094-fd18-47ec-b45f-ad3ee4ba7cc2';

// ── Индивидуальные ────────────────────────────────────────────────────────────

export interface Slot {
  date: string;
  weekday: number;
  weekday_name: string;
  time_from: string;
  time_to: string;
  teacher_id: number;
  teacher_name: string;
}

export interface DayGroup {
  weekday: number;
  weekday_name: string;
  slots: Slot[];
}

export const TEACHER_SHORT: Record<number, string> = {
  2: 'Анастасия',
  18: 'Анна',
  11: 'Валерия',
  4: 'Дарья',
};

export const TEACHER_COLOR: Record<number, string> = {
  2: 'bg-purple-100 text-purple-700 border-purple-200',
  18: 'bg-teal-100 text-teal-700 border-teal-200',
  11: 'bg-green-100 text-green-700 border-green-200',
  4: 'bg-orange-100 text-orange-700 border-orange-200',
};

// ── Группы ────────────────────────────────────────────────────────────────────

export interface GroupCell {
  date: string;
  enrolled: number;
  free: number;
  lesson_id?: number;
  student_ids: number[];
  status?: number; // 1 — запланировано, 3 — проведено
}

export interface Customer {
  id: number;
  name?: string;
  dob?: string; // дата рождения, формат "DD.MM.YYYY" из S20
  b_date?: string; // служебная дата заведения карточки (НЕ день рождения)
  is_study?: number; // 0 — лид, 1 — учится
}

export interface GroupRow {
  time: string;
  teacher_id: number;
  teacher_name: string;
  cells: Record<string, GroupCell>;
  group_id?: number | null;
}

export interface GroupsWeekResponse {
  max_size: number;
  date_from: string;
  date_to: string;
  rows: GroupRow[];
}

export interface RawLesson {
  id: number;
  date: string;
  time_from: string;
  lesson_type_id: number;
  status: number;
  teacher_ids: number[];
  customer_ids?: number[];
  group_ids?: number[];
  details?: Array<{ customer_id?: number }>;
}

export interface RawTeacher {
  id: number;
  name?: string;
}

export const MAX_GROUP_SIZE = 6;

export const WEEKDAY_SHORT = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

// ВАЖНО: возвращаем дату в ЛОКАЛЬНОМ часовом поясе, а не UTC.
// toISOString() даёт UTC и в МСК (+3) сдвигает дату на сутки назад.
export const fmtDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
export const getMonday = (d: Date) => {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
};
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const fmtRu = (d: Date) =>
  d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

// Строим таблицу из сырого массива lessons на стороне фронта
export const buildGroupRowsFromLessons = (
  lessons: RawLesson[],
  teachers: RawTeacher[],
  weekStart: Date,
): GroupRow[] => {
  const teacherShort: Record<number, string> = {};
  for (const t of teachers) {
    const full = (t.name || '').trim();
    const parts = full.split(/\s+/).filter(Boolean);
    if (parts.length === 0) teacherShort[t.id] = `#${t.id}`;
    else if (parts.length === 1) teacherShort[t.id] = parts[0];
    else teacherShort[t.id] = `${parts[1]} ${parts[0][0]}.`;
  }

  // Сравниваем по ISO-датам (строкой) — это безопаснее, чем по timestamp,
  // т.к. избегаем любых нюансов часового пояса.
  const weekDateMap: Record<string, number> = {};
  for (let i = 0; i < 6; i++) {
    weekDateMap[fmtDate(addDays(weekStart, i))] = i; // ISO -> индекс дня недели (0=ПН..5=СБ)
  }

  const rows: Record<string, GroupRow> = {};
  for (const lesson of lessons) {
    // Берём только групповые занятия. lesson_type_id:
    //   1 — индивидуальный, 2 — групповой, 3 — диагностика, 4 — пробный и т.п.
    if (lesson.lesson_type_id !== 2) continue;
    // Берём запланированные (1) и проведённые (3). Отменённые (2) — пропускаем.
    if (lesson.status !== 1 && lesson.status !== 3) continue;
    const dateStr = (lesson.date || '').slice(0, 10);
    if (!dateStr) continue;
    const weekday = weekDateMap[dateStr];
    if (weekday === undefined) continue; // не в текущей неделе (включая воскресенье)

    let timeFrom = lesson.time_from || '';
    if (timeFrom.includes(' ')) timeFrom = timeFrom.split(' ').pop() || '';
    timeFrom = timeFrom.slice(0, 5);
    if (!timeFrom) continue;

    const tids = lesson.teacher_ids || [];
    if (!tids.length) continue;
    const teacherId = Number(tids[0]);

    const students = new Set<number>();
    for (const sid of lesson.customer_ids || []) students.add(sid);
    for (const det of lesson.details || []) {
      if (det && det.customer_id != null) students.add(det.customer_id);
    }
    const enrolled = students.size;

    const groupId =
      Array.isArray(lesson.group_ids) && lesson.group_ids.length
        ? lesson.group_ids[0]
        : null;

    const key = `${timeFrom}__${teacherId}`;
    if (!rows[key]) {
      rows[key] = {
        time: timeFrom,
        teacher_id: teacherId,
        teacher_name: teacherShort[teacherId] || `#${teacherId}`,
        cells: {},
        group_id: groupId,
      };
    }
    const prev = rows[key].cells[String(weekday)];
    if (!prev || enrolled > prev.enrolled) {
      rows[key].cells[String(weekday)] = {
        date: dateStr,
        enrolled,
        free: Math.max(0, MAX_GROUP_SIZE - enrolled),
        lesson_id: lesson.id,
        student_ids: Array.from(students),
        status: lesson.status,
      };
    }
  }

  return Object.values(rows).sort((a, b) => {
    if (a.time !== b.time) return a.time.localeCompare(b.time);
    return a.teacher_name.localeCompare(b.teacher_name);
  });
};

// Возраст по дате рождения. Понимаем оба формата:
//   "YYYY-MM-DD..." (ISO) и "DD.MM.YYYY" (как отдаёт S20 в поле dob).
export const calcAge = (bDate?: string, onDate?: Date): number | null => {
  if (!bDate) return null;
  let by: number | null = null;
  let bm: number | null = null;
  let bd: number | null = null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(bDate);
  if (iso) {
    by = Number(iso[1]);
    bm = Number(iso[2]);
    bd = Number(iso[3]);
  } else {
    const ru = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(bDate);
    if (ru) {
      bd = Number(ru[1]);
      bm = Number(ru[2]);
      by = Number(ru[3]);
    }
  }
  if (by == null || bm == null || bd == null) return null;
  const ref = onDate || new Date();
  let age = ref.getFullYear() - by;
  const mNow = ref.getMonth() + 1;
  const dNow = ref.getDate();
  if (mNow < bm || (mNow === bm && dNow < bd)) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
};

// В S20 у учеников name = "Имя Фамилия", у лидов часто полное ФИО
// ("Фамилия Имя Отчество"). У сиблингов одна карточка вида
// "Имя1 и Имя2 Фамилия" (или "Имя1, Имя2 Фамилия"). Для расписания нужно
// показывать только «Имя Фамилия».
export const formatStudentName = (full?: string): string => {
  const s = (full || '').trim().replace(/\s+/g, ' ');
  if (!s) return '';

  // Точечная замена: в нашей табличке карточку "Марк и Сеня Константиновы"
  // (а также вариации с запятой/порядком имён) показываем как "Сеня Константинов".
  if (/Константинов/i.test(s) && /Сен[яи]/i.test(s) && /Марк/i.test(s)) {
    return 'Сеня Константинов';
  }

  // Сиблинги: "Сеня и Марк Константиновы" / "Сеня, Марк Константиновы"
  // Берём первое имя + последнее слово (фамилия), при необходимости
  // приводим фамилию из мн. числа в ед. ("Константиновы" → "Константинов").
  const siblings = /(\sи\s|\s&\s|,\s*)/i.test(s);
  if (siblings) {
    const parts = s.split(/\s+/);
    const first = parts[0];
    let last = parts[parts.length - 1];
    if (/ы$/i.test(last)) last = last.slice(0, -1);
    else if (/и$/i.test(last) && last.length > 2) last = last.slice(0, -1) + 'й';
    return `${first} ${last}`;
  }

  const parts = s.split(' ');
  if (parts.length <= 2) return s;
  // 3+ слов — считаем что это "Фамилия Имя Отчество" (как обычно вводят лидов в S20)
  return `${parts[1]} ${parts[0]}`;
};