const API_URL = 'https://functions.poehali.dev/83e343d0-ee38-4e33-94eb-f28c8514f37c';

export type ShiftKind = 'work' | 'dayoff' | 'vacation' | 'sick';

export interface AdminShift {
  id: number;
  staff_id: number;
  staff_name: string;
  shift_date: string;
  time_from: string;
  time_to: string;
  kind: ShiftKind;
  note: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface ShiftAdmin {
  id: number;
  full_name: string;
  job_title: string | null;
}

/** Задача из журнала административного учёта — показываем в графике */
export interface ShiftTask {
  staff_id: number;
  log_date: string;
  task_code: string;
  task_title: string;
  subject: string | null;
  minutes: number;
}

export interface MyShiftState {
  started_at: string | null;
  finished_at: string | null;
  planned: boolean;
}

const authHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const token = localStorage.getItem('staff_token') || '';
  return token ? { ...extra, 'X-Auth-Token': token } : extra;
};

/** Смены и список администраторов за месяц «2026-08» */
export async function fetchShifts(
  month: string,
): Promise<{ shifts: AdminShift[]; admins: ShiftAdmin[]; tasks: ShiftTask[] }> {
  const r = await fetch(`${API_URL}?month=${month}`, { headers: authHeaders() });
  if (!r.ok) return { shifts: [], admins: [], tasks: [] };
  const data = await r.json();
  return { shifts: data.shifts || [], admins: data.admins || [], tasks: data.tasks || [] };
}

/** Состояние моей смены на дату — открыта, закрыта или ещё не начата */
export async function fetchMyShift(date: string): Promise<MyShiftState | null> {
  const r = await fetch(`${API_URL}?action=my-shift&date=${date}`, { headers: authHeaders() });
  if (!r.ok) return null;
  const data = await r.json();
  return { started_at: data.started_at, finished_at: data.finished_at, planned: !!data.planned };
}

/** Администратор, который прямо сейчас на смене */
export interface OnShiftAdmin {
  staff_id: number;
  staff_name: string;
  job_title: string | null;
  role: string | null;
  started_at: string | null;
}

/** Кто из админов сейчас на смене — этот список забирает «Окно взаимодействия» */
export async function fetchOnShiftNow(): Promise<OnShiftAdmin[]> {
  const r = await fetch(`${API_URL}?action=on-shift`);
  if (!r.ok) return [];
  const data = await r.json().catch(() => ({}));
  return data.on_shift || [];
}

/** Отметка «на смене» / «смена закончена» */
export async function markMyShift(
  date: string,
  action: 'start' | 'finish',
): Promise<MyShiftState | null> {
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ action, date }),
  });
  const data = await r.json().catch(() => ({}));
  if (!data.ok) return null;
  return { started_at: data.started_at, finished_at: data.finished_at, planned: true };
}

/** «2026-08-18T08:03:11» → «8:03» */
export function shiftTime(ts: string | null): string {
  if (!ts) return '';
  const d = new Date(ts.includes('T') ? ts : ts.replace(' ', 'T'));
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export async function saveShift(payload: {
  staff_id: number;
  date: string;
  time_from?: string;
  time_to?: string;
  kind: ShiftKind;
  note?: string;
}): Promise<boolean> {
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  return !!data.ok;
}

export async function deleteShift(staffId: number, date: string): Promise<boolean> {
  const r = await fetch(`${API_URL}?staff_id=${staffId}&date=${date}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await r.json().catch(() => ({}));
  return !!data.ok;
}

export const KIND_META: Record<ShiftKind, { label: string; cls: string; dot: string }> = {
  work: { label: 'Смена', cls: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' },
  dayoff: { label: 'Выходной', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  vacation: { label: 'Отпуск', cls: 'bg-sky-100 text-sky-800 border-sky-200', dot: 'bg-sky-500' },
  sick: { label: 'Больничный', cls: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
};