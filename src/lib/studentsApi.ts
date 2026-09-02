import { splitEmoji, withEmoji } from '@/lib/emoji';

const API_URL = 'https://functions.poehali.dev/c0e33e31-3223-49c3-96e6-b90391728c1e';

export interface StudentTariff {
  name: string;
  // Короткая запись для таблицы: «4 ур/нед (3 мес.)»
  short_name?: string;
  // Абонемент закончился по дате — в CRM помечен «АРХИВНЫЙ»
  is_archived?: boolean;
  // Сколько уроков в неделю оплачено (null — не разобрали название)
  per_week?: number | null;
  e_date: string | null;
  is_active: boolean;
  paid_lessons_left: number;
  shared_with_siblings?: boolean;
}

export interface DiagnosticBubble {
  date: string;
  type: 'primary' | 'followup' | 'planned';
  link: string | null;
  conclusion: string;
  topic: string;
  note: string;
}

export type VacationEndType = 'exact' | 'start_month' | 'mid_month' | 'end_month';
export type FirstLessonStatus = 'paid' | 'agreed' | 'not_agreed';

export interface StudentVacation {
  id: number;
  date_from: string | null;
  date_to: string | null;
  vacation_end_type: VacationEndType;
  first_lesson_date: string | null;
  first_lesson_status: FirstLessonStatus;
  note: string;
}

export interface StudentComment {
  id: number;
  executor_id: number | null;
  executor_name: string | null;
  comment_date: string | null;
  done: string;
  parent_reply: string;
  extra: string;
}

export type InteractionSource = 'parent' | 'teacher' | 'admin';

export interface InteractionReply {
  id?: number;
  reply_source: InteractionSource;
  reply_date: string | null;
  reply_text: string;
}

export interface StudentInteraction {
  id: number;
  request_source: InteractionSource;
  request_date: string | null;
  request_text: string;
  done: boolean;
  done_text: string;
  admin_comment: string;
  replies: InteractionReply[];
}

export interface Admin {
  id: number;
  name: string;
  color: string;
}

export interface StudentRow {
  id: number;
  name: string;
  status_id: number | null;
  status_name: string;
  age: number | null;
  age_manual: boolean;
  // Населённый пункт и часовой пояс из анкеты родителя («МСК+4»)
  city: string;
  city_timezone: string;
  city_region: string;
  // true — город внесён вручную, а не взят из анкеты
  city_manual: boolean;
  // id карточки в AlfaCRM: у сиблингов строк две, а карточка одна
  crm_customer_id: number;
  conclusion: string;
  conclusion_manual: boolean;
  recommendations: string | null;
  last_diagnostic: string | null;
  // Диагностика уже стоит в расписании CRM (ближайшая дата)
  scheduled_diagnostic?: string | null;
  next_diagnostic: string | null;
  report_link: string | null;
  tariff: StudentTariff | null;
  // Фактически поставленные регулярные уроки из CRM
  planned_lessons: { group: number; individual: number; total: number } | null;
  // Сверка расписания с абонементом: ok / warn / bad / none
  match_status?: 'ok' | 'warn' | 'bad' | 'none';
  match_note?: string;
  diagnostics: DiagnosticBubble[];
  vacation: StudentVacation | null;
  comments: StudentComment[];
  interactions: StudentInteraction[];
  interaction_ok: boolean | null;
}

export type StatusFilter =
  | 'all_active'
  | 'active'
  | 'vacation'
  | 'vacation_due'
  | 'frozen'
  | 'dropped';

// Маппинг фильтров на коды статусов CRM.
// 1=Активен, 2=Завершил, 3=Бросил, 4=Каникулы(заморожен), 5=Каникулы
export const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all_active', label: 'Все действующие' },
  { id: 'active', label: 'Активен' },
  { id: 'vacation', label: 'Каникулы' },
  { id: 'vacation_due', label: 'Каникуляры — пора связаться' },
  { id: 'frozen', label: 'Абонемент заморожен' },
  { id: 'dropped', label: 'Бросил' },
];

// Дата возврата с каникул уже наступила (или прошла).
// Даты в CRM хранятся неточно: вместо числа может стоять «начало / середина /
// конец месяца». Поэтому сравниваем не по дню, а по декаде: «середина сентября»
// наступает только с 11-го числа — 2 сентября такого ребёнка ещё не дёргаем.
export const vacationReturnDue = (v: StudentVacation | null): boolean => {
  if (!v || !v.date_to) return false;

  const d = new Date(v.date_to);
  if (Number.isNaN(d.getTime())) return false;

  const partOf = (day: number) => (day <= 10 ? 0 : day <= 20 ? 1 : 2);

  // Указана КОНКРЕТНАЯ дата возврата — сравниваем именно по дате, а не по
  // декаде месяца. Напоминаем за день: ученик с датой 09.09 попадёт в
  // «пора связаться» 08.09, а не с начала месяца.
  if (v.vacation_end_type === 'exact') {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return d <= tomorrow;
  }

  const part =
    v.vacation_end_type === 'start_month'
      ? 0
      : v.vacation_end_type === 'mid_month'
        ? 1
        : v.vacation_end_type === 'end_month'
          ? 2
          : partOf(d.getDate());

  const idx = (y: number, m: number, p: number) => (y * 12 + m) * 3 + p;
  const now = new Date();

  return (
    idx(d.getFullYear(), d.getMonth(), part) <=
    idx(now.getFullYear(), now.getMonth(), partOf(now.getDate()))
  );
};

// Несколько статусов сразу: строка подходит, если совпал ЛЮБОЙ из выбранных.
// Пустой список = ничего не выбрано, показываем всех действующих.
export const matchesAnyFilter = (
  statusId: number | null,
  filters: StatusFilter[],
  vacation: StudentVacation | null = null,
): boolean => {
  if (!filters.length) return matchesFilter(statusId, 'all_active', vacation);
  return filters.some((f) => matchesFilter(statusId, f, vacation));
};

export const matchesFilter = (
  statusId: number | null,
  filter: StatusFilter,
  vacation: StudentVacation | null = null,
): boolean => {
  switch (filter) {
    case 'all_active':
      return statusId !== 3;
    case 'active':
      return statusId === 1;
    case 'vacation':
      return statusId === 4 || statusId === 5;
    // Каникуляры, которых пора возвращать: срок отдыха уже наступил.
    case 'vacation_due':
      return (statusId === 4 || statusId === 5) && vacationReturnDue(vacation);
    case 'frozen':
      return statusId === 4;
    case 'dropped':
      return statusId === 3;
    default:
      return true;
  }
};

// Приводим ФИО к виду «... <эмодзи>»: вырезаем все эмодзи из строки
// и приклеиваем их в конец, не меняя порядок слов имени.
export const normalizeStudentName = (raw: string): string => {
  if (!raw) return raw;
  const { text, emojis } = splitEmoji(raw);
  return withEmoji(text, emojis);
};

// Список учеников собирается из AlfaCRM и загружается несколько секунд,
// а нужен сразу пяти вкладкам кабинета (ученики, каникулы, взаимодействия,
// мониторинг, пользователи). Без кеша каждое переключение вкладки — новая
// загрузка с нуля. Держим результат в памяти вкладки браузера:
//  - параллельные запросы разделяют один и тот же ответ (dedupe),
//  - повторный вход в раздел берёт готовые данные,
//  - любое сохранение сбрасывает кеш, чтобы не показывать устаревшее.
const STUDENTS_TTL_MS = 5 * 60 * 1000;

let studentsCache: { at: number; data: StudentRow[] } | null = null;
let studentsInFlight: Promise<StudentRow[]> | null = null;

export const invalidateStudentsCache = (): void => {
  studentsCache = null;
  studentsInFlight = null;
};

const loadStudents = async (): Promise<StudentRow[]> => {
  const res = await fetch(`${API_URL}?mode=list`);
  if (!res.ok) throw new Error('Не удалось загрузить учеников');
  const data = await res.json();
  const items = (data.items as StudentRow[]) || [];
  return items.map((it) => ({ ...it, name: normalizeStudentName(it.name) }));
};

export const fetchStudents = async (force = false): Promise<StudentRow[]> => {
  if (force) invalidateStudentsCache();

  if (studentsCache && Date.now() - studentsCache.at < STUDENTS_TTL_MS) {
    return studentsCache.data;
  }
  if (studentsInFlight) return studentsInFlight;

  studentsInFlight = loadStudents()
    .then((data) => {
      studentsCache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      studentsInFlight = null;
    });

  return studentsInFlight;
};

export const saveVacation = async (
  studentId: number,
  fields: Partial<Omit<StudentVacation, 'id'>>,
): Promise<void> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_vacation', student_id: studentId, ...fields }),
  });
  if (!res.ok) throw new Error('Не удалось сохранить каникулы');
  invalidateStudentsCache();
};

export const fetchAdmins = async (): Promise<Admin[]> => {
  const res = await fetch(`${API_URL}?mode=admins`);
  if (!res.ok) throw new Error('Не удалось загрузить исполнителей');
  const data = await res.json();
  return (data.admins || []) as Admin[];
};

export const saveComment = async (
  studentId: number,
  fields: {
    id?: number;
    executor_id?: number | null;
    executor_name?: string | null;
    comment_date?: string | null;
    done?: string;
    parent_reply?: string;
    extra?: string;
  },
): Promise<number> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_comment', student_id: studentId, ...fields }),
  });
  if (!res.ok) throw new Error('Не удалось сохранить комментарий');
  invalidateStudentsCache();
  const data = await res.json();
  return data.id as number;
};

export const deleteComment = async (id: number): Promise<void> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_comment', id }),
  });
  if (!res.ok) throw new Error('Не удалось удалить комментарий');
  invalidateStudentsCache();
};

export const saveInteraction = async (
  studentId: number,
  fields: {
    id?: number;
    request_source: InteractionSource;
    request_date: string | null;
    request_text: string;
    done: boolean;
    done_text: string;
    admin_comment: string;
    replies: InteractionReply[];
  },
): Promise<{ id: number; replies: InteractionReply[] }> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_interaction', student_id: studentId, ...fields }),
  });
  if (!res.ok) throw new Error('Не удалось сохранить взаимодействие');
  invalidateStudentsCache();
  const data = await res.json();
  return { id: data.id as number, replies: (data.replies || []) as InteractionReply[] };
};

export const deleteInteraction = async (id: number): Promise<void> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_interaction', id }),
  });
  if (!res.ok) throw new Error('Не удалось удалить взаимодействие');
  invalidateStudentsCache();
};

export const setInteractionOk = async (
  studentId: number,
  ok: boolean | null,
): Promise<void> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'set_interaction_ok', student_id: studentId, ok }),
  });
  if (!res.ok) throw new Error('Не удалось изменить статус');
  invalidateStudentsCache();
};

// Сохранить ручную правку (формы нарушений и/или возраст) — приоритет над данными CRM.
export const saveStudentOverride = async (
  studentId: number,
  fields: {
    conclusion?: string;
    age?: number | null;
    city?: string;
    city_region?: string;
    city_timezone?: string;
    // id карточки CRM — нужен, чтобы записать город в примечание
    crm_customer_id?: number;
  },
): Promise<void> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save_override',
      student_id: studentId,
      ...fields,
    }),
  });
  if (!res.ok) throw new Error('Не удалось сохранить изменения');
  invalidateStudentsCache();
};