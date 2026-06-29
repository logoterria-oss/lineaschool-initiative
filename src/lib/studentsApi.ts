const API_URL = 'https://functions.poehali.dev/c0e33e31-3223-49c3-96e6-b90391728c1e';

export interface StudentTariff {
  name: string;
  e_date: string | null;
  is_active: boolean;
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

export type VacationEndType = 'exact' | 'mid_month' | 'end_month';
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