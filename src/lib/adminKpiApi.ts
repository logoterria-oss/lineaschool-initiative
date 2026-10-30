import func2url from '../../backend/func2url.json';
import { getStaffToken } from './staffApi';

const API_URL = (func2url as Record<string, string>)['admin-kpi'];

export interface ResponseRow {
  staff_id: number | null;
  phone: string;
  staff_name: string | null;
  month: string;
  dialogs: number;
  total_minutes: number;
  days: number;
}

export interface ResponseStats {
  rows: ResponseRow[];
  updated_at: string | null;
}

export async function fetchResponseStats(from: string, to: string, all = false): Promise<ResponseStats | null> {
  const token = getStaffToken();
  const qs = new URLSearchParams({ action: 'response', from, to, ...(all ? { scope: 'all' } : {}) });
  const res = await fetch(`${API_URL}?${qs}`, { headers: token ? { 'X-Auth-Token': token } : {} });
  if (!res.ok) return null;
  const data = await res.json();
  return { rows: data.rows || [], updated_at: data.updated_at || null };
}
