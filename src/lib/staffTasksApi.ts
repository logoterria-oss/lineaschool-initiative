import func2url from '../../backend/func2url.json';
import { getStaffToken } from '@/lib/staffApi';

const URL = (func2url as Record<string, string>)['staff-tasks'];

export type Urgency = 'urgent' | 'medium' | 'low';

export const URGENCY_OPTIONS: { value: Urgency; label: string; hint: string; activeClass: string; badgeClass: string }[] = [
  { value: 'urgent', label: 'Срочно!', hint: 'решить в течение дня', activeClass: 'bg-red-600 border-red-600 text-white', badgeClass: 'bg-red-100 text-red-700' },
  { value: 'medium', label: 'Средне срочно', hint: 'решить в течение 3х дней', activeClass: 'bg-amber-500 border-amber-500 text-white', badgeClass: 'bg-amber-100 text-amber-800' },
  { value: 'low', label: 'Не срочно', hint: 'решить, когда появится свободное время', activeClass: 'bg-emerald-600 border-emerald-600 text-white', badgeClass: 'bg-emerald-100 text-emerald-700' },
];

export interface TaskFile {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface StaffTask {
  id: number;
  title: string;
  description: string;
  author_id: number;
  author_name: string;
  assignee_id: number;
  assignee_name: string;
  for_shift: boolean;
  is_problem: boolean;
  reporter_name: string;
  done_by_name: string | null;
  due_date: string | null;
  urgency: Urgency;
  created_msk: string;
  attachments: TaskFile[];
  status: 'open' | 'done';
  done_at: string | null;
  done_comment: string;
  created_at: string;
}

export interface Assignee {
  id: number;
  full_name: string;
  role: string;
  job_title: string | null;
  label: string;
}

export interface TasksData {
  mine: StaffTask[];
  given: StaffTask[];
  assignees: Assignee[];
  can_assign: boolean;
  on_shift: boolean;
}

const headers = () => ({ 'Content-Type': 'application/json', 'X-Auth-Token': getStaffToken() || '' });

export const fetchTasks = async (): Promise<TasksData> => {
  const r = await fetch(URL, { headers: headers() });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Ошибка загрузки');
  return d;
};

const post = async (body: object) => {
  const r = await fetch(URL, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Ошибка');
  return d;
};

export const createTask = (v: { title: string; description: string; due_date: string; urgency: Urgency; assignee_ids: number[]; attachments: TaskFile[]; reporter_name?: string }) =>
  post({ action: 'create', ...v });
const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

export const uploadTaskFile = async (file: File): Promise<TaskFile> => {
  const data = await readAsDataUrl(file);
  const d = await post({ action: 'upload', name: file.name, type: file.type, data });
  return d.file as TaskFile;
};
export const setTaskUrgency = (id: number, urgency: Urgency) => post({ action: 'update', id, urgency });
export const setTaskDone = (id: number, done: boolean, comment = '') => post({ action: 'status', id, done, comment });
export const deleteTask = (id: number) => post({ action: 'delete', id });