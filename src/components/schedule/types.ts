import { splitEmoji, withEmoji } from '@/lib/emoji';

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
  2: 'Шишаева А.',
  18: 'Карамова А.',
  11: 'Камнева В.',
  4: 'Еремина Д.',
  20: 'Канкулова Е.',
  15: 'Мацвей Е.',
};

export const TEACHER_COLOR: Record<number, string> = {
  2: 'bg-purple-100 text-purple-700 border-purple-200',
  18: 'bg-teal-100 text-teal-700 border-teal-200',
  11: 'bg-green-100 text-green-700 border-green-200',
  4: 'bg-orange-100 text-orange-700 border-orange-200',
  20: 'bg-pink-100 text-pink-700 border-pink-200',
  15: 'bg-sky-100 text-sky-700 border-sky-200',
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
  details?: Array<{ customer_id?: number; is_attend?: number | null }>;
}

export interface RawTeacher {
  id: number;
  name?: string;
}

export const MAX_GROUP_SIZE = 6;

export const WEEKDAY_SHORT = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

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
  for (let i = 0; i < 7; i++) {
    weekDateMap[fmtDate(addDays(weekStart, i))] = i; // ISO -> индекс дня недели (0=ПН..6=ВС)
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

    // Собираем absent-список из details (is_attend === 0 = отсутствует/приостановлен)
    const absentIds = new Set<number>();
    for (const det of lesson.details || []) {
      if (det && det.customer_id != null && det.is_attend === 0) {
        absentIds.add(det.customer_id);
      }
    }
    const students = new Set<number>();
    for (const sid of lesson.customer_ids || []) {
      if (!absentIds.has(sid)) students.add(sid);
    }
    for (const det of lesson.details || []) {
      if (det && det.customer_id != null && det.is_attend !== 0) students.add(det.customer_id);
    }
    const enrolled = students.size;

    const groupId =
      Array.isArray(lesson.group_ids) && lesson.group_ids.length
        ? lesson.group_ids[0]
        : null;

    // Группа входит в ключ: у педагога в одно время могут идти две разные
    // группы — без неё вторая пропадала бы из расписания
    const key = `${timeFrom}__${teacherId}__${groupId}`;
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
// Ручной маппинг возраста для случаев, когда в S20 дата рождения не указана
// (например, у "склеенных" карточек сиблингов). Ключ — отформатированное
// имя из formatStudentName, значение — возраст в годах.
const MANUAL_AGE: Record<string, number> = {
  'Сеня Константинов': 17,
  'Рита Алексеева': 17,
  'Ксюша Моисеева': 8,
};

// Имена, у которых S20 возвращает некорректный возраст (0 или мусор) —
// для них всегда берём ручное значение вместо вычисленного.
const FORCE_MANUAL_AGE = new Set(['Сеня Константинов', 'Рита Алексеева', 'Ксюша Моисеева']);

// ── Возрастные группы ─────────────────────────────────────────────────────────
// Группы с заранее известной возрастной категорией. Ключ — день недели
// (0=ПН..6=ВС) и время начала. Педагог не важен: категория закреплена
// за самой группой в расписании.
export interface AgeGroupRule {
  weekdays: number[];
  time: string;
  from: number;
  to: number;
}

export const AGE_GROUP_RULES: AgeGroupRule[] = [
  // ВТ и ЧТ 19:00 — подростковая группа
  { weekdays: [1, 3], time: '19:00', from: 14, to: 18 },
];

export const findAgeGroupRule = (weekday: number, time: string): AgeGroupRule | null => {
  const t = (time || '').slice(0, 5);
  for (const r of AGE_GROUP_RULES) {
    if (r.weekdays.includes(weekday) && r.time === t) return r;
  }
  return null;
};

export const ageRangeLabel = (from: number, to: number) => `${from}–${to} лет`;

export const manualAge = (formattedName: string): number | null =>
  MANUAL_AGE[formattedName] ?? null;

export const shouldForceManualAge = (formattedName: string): boolean =>
  FORCE_MANUAL_AGE.has(formattedName);

export const formatStudentName = (full?: string): string => {
  // Эмодзи считаем частью имени и переносим в конец, не влияя на перестановку слов.
  const { text: s, emojis } = splitEmoji((full || '').trim().replace(/\s+/g, ' '));
  if (!s) return withEmoji('', emojis);

  const done = (name: string) => withEmoji(name, emojis);

  // Точечная замена: в нашей табличке карточку "Марк и Сеня Константиновы"
  // (а также вариации с запятой/порядком имён) показываем как "Сеня Константинов".
  if (/Константинов/i.test(s) && /Сен[яи]/i.test(s) && /Марк/i.test(s)) {
    return done('Сеня Константинов');
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
    return done(`${first} ${last}`);
  }

  const parts = s.split(' ');
  if (parts.length <= 2) return done(s);
  // 3+ слов — считаем что это "Фамилия Имя Отчество" (как обычно вводят лидов в S20)
  return done(`${parts[1]} ${parts[0]}`);
};