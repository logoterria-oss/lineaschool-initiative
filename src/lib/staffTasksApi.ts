import func2url from '../../backend/func2url.json';
import { getStaffToken } from '@/lib/staffApi';

const URL = (func2url as Record<string, string>)['staff-tasks'];

export interface StaffTask {
  id: number;
  title: string;
  description: string;
  author_id: number;
  author_name: string;
  assignee_id: number;
  assignee_name: string;
  due_date: string | null;
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
}

export interface TasksData {
  mine: StaffTask[];
  given: StaffTask[];
  assignees: Assignee[];
  can_assign: boolean;
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

export const createTask = (v: { title: string; description: string; due_date: string; assignee_ids: number[] }) =>
  post({ action: 'create', ...v });
export const setTaskDone = (id: number, done: boolean, comment = '') => post({ action: 'status', id, done, comment });
export const deleteTask = (id: number) => post({ action: 'delete', id });
