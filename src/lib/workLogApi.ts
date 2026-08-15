import func2url from '../../backend/func2url.json';

const API_URL = (func2url as Record<string, string>)['work-log'];

const authHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const token = localStorage.getItem('staff_token') || '';
  return token ? { ...extra, 'X-Auth-Token': token } : extra;
};

export interface WorkLogEntry {
  id: number;
  staff_id: number;
  staff_name: string;
  staff_role: string;
  log_date: string;
  task_code: string;
  task_title: string;
  category: string;
  subject: string | null;
  comment: string | null;
  minutes: number;
  created_at: string;
}

export interface WorkLogInput {
  log_date: string;
  task_code: string;
  task_title: string;
  category: string;
  subject?: string;
  comment?: string;
  minutes: number;
}

export interface StaffStat {
  staff_id: number;
  staff_name: string;
  staff_role: string;
  tasks: number;
  minutes: number;
}

export interface TaskStat {
  task_code: string;
  task_title: string;
  category: string;
  tasks: number;
  minutes: number;
}

export interface DayStat {
  log_date: string;
  tasks: number;
  minutes: number;
}

export interface WorkLogStats {
  ok: boolean;
  date_from: string;
  date_to: string;
  total_tasks: number;
  total_minutes: number;
  prev_tasks: number;
  prev_minutes: number;
  by_staff: StaffStat[];
  by_task: TaskStat[];
  by_day: DayStat[];
  can_see_all: boolean;
  scope_all: boolean;
}

export async function addWorkLog(input: WorkLogInput): Promise<{ ok: boolean; message?: string }> {
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });
  const data = await r.json();
  return { ok: !!data.ok, message: data.message };
}

export async function deleteWorkLog(id: number): Promise<boolean> {
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ action: 'delete', id }),
  });
  const data = await r.json();
  return !!data.ok;
}

/** allStaff — сводка по всем сотрудникам (только руководитель), иначе свои записи */
export async function listWorkLog(range: {
  date_from?: string;
  date_to?: string;
  staff_id?: number;
  allStaff?: boolean;
}): Promise<{ items: WorkLogEntry[]; canSeeAll: boolean }> {
  const q = new URLSearchParams();
  if (range.date_from) q.set('date_from', range.date_from);
  if (range.date_to) q.set('date_to', range.date_to);
  if (range.staff_id) q.set('staff_id', String(range.staff_id));
  if (range.allStaff) q.set('scope', 'all');
  const r = await fetch(`${API_URL}?${q.toString()}`, { headers: authHeaders() });
  if (!r.ok) return { items: [], canSeeAll: false };
  const data = await r.json();
  return { items: data.items || [], canSeeAll: !!data.can_see_all };
}

export async function fetchWorkLogStats(range: {
  date_from?: string;
  date_to?: string;
  allStaff?: boolean;
}): Promise<WorkLogStats | null> {
  const q = new URLSearchParams({ action: 'stats' });
  if (range.date_from) q.set('date_from', range.date_from);
  if (range.date_to) q.set('date_to', range.date_to);
  if (range.allStaff) q.set('scope', 'all');
  const r = await fetch(`${API_URL}?${q.toString()}`, { headers: authHeaders() });
  if (!r.ok) return null;
  return r.json();
}

/** «95» → «1 ч 35 мин» */
export function formatMinutes(total: number): string {
  const m = Math.max(0, Math.round(total || 0));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} мин`;
  if (rest === 0) return `${h} ч`;
  return `${h} ч ${rest} мин`;
}