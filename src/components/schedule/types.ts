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
}

export interface Customer {
  id: number;
  name?: string;
  b_date?: string;
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

export const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
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
    else teacherShort[t.id] = `${parts[0]} ${parts[1][0]}.`;
  }

  const weekStartTs = weekStart.getTime();
  const weekEndTs = addDays(weekStart, 6).getTime();

  const rows: Record<string, GroupRow> = {};
  for (const lesson of lessons) {
    if (lesson.lesson_type_id === 1) continue; // индивидуальные мимо
    // Только запланированные уроки (status=1). 2 — отменённые, 3 — проведённые.
    if (lesson.status !== 1) continue;
    const dateStr = (lesson.date || '').slice(0, 10);
    if (!dateStr) continue;
    const d = new Date(`${dateStr}T00:00:00`);
    const ts = d.getTime();
    if (ts < weekStartTs || ts >= weekEndTs) continue;

    let weekday = d.getDay() - 1; // JS: 0=Вс, нам нужно 0=Пн
    if (weekday < 0) weekday = 6;
    if (weekday > 5) continue; // воскресенье пропускаем

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
      };
    }
  }

  return Object.values(rows).sort((a, b) => {
    if (a.time !== b.time) return a.time.localeCompare(b.time);
    return a.teacher_name.localeCompare(b.teacher_name);
  });
};

// Возраст по дате рождения "YYYY-MM-DD" на указанную дату (или сегодня)
export const calcAge = (bDate?: string, onDate?: Date): number | null => {
  if (!bDate) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(bDate);
  if (!m) return null;
  const by = Number(m[1]);
  const bm = Number(m[2]);
  const bd = Number(m[3]);
  const ref = onDate || new Date();
  let age = ref.getFullYear() - by;
  const mNow = ref.getMonth() + 1;
  const dNow = ref.getDate();
  if (mNow < bm || (mNow === bm && dNow < bd)) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
};

// В S20 поле name уже в формате "Имя Фамилия" — оставляем как есть, только trim.
export const formatStudentName = (full?: string): string => {
  return (full || '').trim();
};