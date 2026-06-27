const API_URL = 'https://functions.poehali.dev/c0e33e31-3223-49c3-96e6-b90391728c1e';

export interface StudentRow {
  id: number;
  name: string;
  status_id: number | null;
  status_name: string;
  last_diagnostic: string | null;
  last_recommendations: string | null;
  last_report_link: string | null;
  next_diagnostic: string | null;
  diagnostics_count: number;
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

export interface SaveDiagInput {
  student_id: number;
  student_name: string;
  diagnostic_date: string;
  recommendations?: string;
  report_link?: string;
  is_first?: boolean;
}

export const saveDiagnostic = async (input: SaveDiagInput): Promise<void> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_diag', ...input }),
  });
  if (!res.ok) throw new Error('Не удалось сохранить диагностику');
};
