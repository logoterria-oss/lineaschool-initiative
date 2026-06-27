const API_URL = 'https://functions.poehali.dev/c0e33e31-3223-49c3-96e6-b90391728c1e';

export interface StudentTariff {
  name: string;
  e_date: string | null;
  is_active: boolean;
}

export interface StudentRow {
  id: number;
  name: string;
  status_id: number | null;
  status_name: string;
  age: number | null;
  conclusion: string;
  recommendations: string | null;
  last_diagnostic: string | null;
  next_diagnostic: string | null;
  report_link: string | null;
  tariff: StudentTariff | null;
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
