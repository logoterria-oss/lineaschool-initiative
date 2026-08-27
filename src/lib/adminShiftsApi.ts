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

/** Задача, поставленная руководителем на конкретный день */
export interface HeadTask {
  id: number;
  shift_date?: string;
  staff_id: number;
  title: string;
}

/** Отметка администратора по пункту чек-листа */
export interface ChecklistMark {
  item_key: string;
  done: boolean;
  comment: string;
}

/** Задачи руководителя на дату или на месяц */
export async function fetchHeadTasks(p: { date?: string; month?: string }): Promise<HeadTask[]> {
  const q = p.date ? `date=${p.date}` : `month=${p.month}`;
  const r = await fetch(`${API_URL}?action=head-tasks&${q}`, { headers: authHeaders() });
  if (!r.ok) return [];
  const data = await r.json().catch(() => ({}));
  return data.tasks || [];
}

/** Переписать задачи руководителя на дату целиком */
export async function saveHeadTasks(
  date: string,
  tasks: { staff_id: number; title: string }[],
): Promise<HeadTask[]> {
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ action: 'head-tasks', date, tasks }),
  });
  const data = await r.json().catch(() => ({}));
  return data.tasks || [];
}

/** Мой чек-лист за день: отметки и задачи руководителя лично мне */
export async function fetchChecklist(
  date: string,
  staffId?: number,
): Promise<{ marks: ChecklistMark[]; head_tasks: HeadTask[] }> {
  const extra = staffId ? `&staff_id=${staffId}` : '';
  const r = await fetch(`${API_URL}?action=checklist&date=${date}${extra}`, {
    headers: authHeaders(),
  });
  if (!r.ok) return { marks: [], head_tasks: [] };
  const data = await r.json().catch(() => ({}));
  return { marks: data.marks || [], head_tasks: data.head_tasks || [] };
}

/** Сохранить галочку и комментарий по пункту чек-листа */
export async function saveChecklistMark(p: {
  date: string;
  item_key: string;
  done: boolean;
  comment: string;
}): Promise<boolean> {
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ action: 'checklist', ...p }),
  });
  const data = await r.json().catch(() => ({}));
  return !!data.ok;
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

/**
 * Время отметки смены: «2026-08-18T08:03:11» → «08:03».
 * Сервер уже присылает московское время, поэтому берём часы и минуты как есть —
 * иначе у сотрудника из другого часового пояса цифры «поедут».
 */
export function shiftTime(ts: string | null): string {
  if (!ts) return '';
  const m = String(ts).match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : '';
}

/** Сегодняшняя дата по Москве — школа живёт по московскому времени */
export function moscowToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts;
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