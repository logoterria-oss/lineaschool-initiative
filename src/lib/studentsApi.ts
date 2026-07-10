const API_URL = 'https://functions.poehali.dev/c0e33e31-3223-49c3-96e6-b90391728c1e';

export interface StudentTariff {
  name: string;
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
  conclusion: string;
  conclusion_manual: boolean;
  recommendations: string | null;
  last_diagnostic: string | null;
  next_diagnostic: string | null;
  report_link: string | null;
  tariff: StudentTariff | null;
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
  | 'frozen'
  | 'dropped';

// Маппинг фильтров на коды статусов CRM.
// 1=Активен, 2=Завершил, 3=Бросил, 4=Каникулы(заморожен), 5=Каникулы
export const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all_active', label: 'Все действующие' },
  { id: 'active', label: 'Активен' },
  { id: 'vacation', label: 'Каникулы' },
  { id: 'frozen', label: 'Абонемент заморожен' },
  { id: 'dropped', label: 'Бросил' },
];

export const matchesFilter = (statusId: number | null, filter: StatusFilter): boolean => {
  switch (filter) {
    case 'all_active':
      return statusId !== 3;
    case 'active':
      return statusId === 1;
    case 'vacation':
      return statusId === 4 || statusId === 5;
    case 'frozen':
      return statusId === 4;
    case 'dropped':
      return statusId === 3;
    default:
      return true;
  }
};

export const fetchStudents = async (): Promise<StudentRow[]> => {
  const res = await fetch(`${API_URL}?mode=list`);
  if (!res.ok) throw new Error('Не удалось загрузить учеников');
  const data = await res.json();
  return data.items as StudentRow[];
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
    replies: InteractionReply[];
  },
): Promise<{ id: number; replies: InteractionReply[] }> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_interaction', student_id: studentId, ...fields }),
  });
  if (!res.ok) throw new Error('Не удалось сохранить взаимодействие');
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
};

// Сохранить ручную правку (формы нарушений и/или возраст) — приоритет над данными CRM.
export const saveStudentOverride = async (
  studentId: number,
  fields: { conclusion?: string; age?: number | null },
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
};