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
}

export interface ShiftAdmin {
  id: number;
  full_name: string;
  job_title: string | null;
}

const authHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const token = localStorage.getItem('staff_token') || '';
  return token ? { ...extra, 'X-Auth-Token': token } : extra;
};

/** Смены и список администраторов за месяц «2026-08» */
export async function fetchShifts(month: string): Promise<{ shifts: AdminShift[]; admins: ShiftAdmin[] }> {
  const r = await fetch(`${API_URL}?month=${month}`, { headers: authHeaders() });
  if (!r.ok) return { shifts: [], admins: [] };
  const data = await r.json();
  return { shifts: data.shifts || [], admins: data.admins || [] };
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
