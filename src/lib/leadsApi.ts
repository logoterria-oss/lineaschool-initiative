import func2url from '../../backend/func2url.json';
import { getStaffToken } from './staffApi';

const URL = (func2url as Record<string, string>)['leads-manage'];

export interface Lead {
  id: number;
  parent_name: string;
  student_name: string;
  student_age: string;
  contact: string;
  request_date: string;
  responsible: string;
  processing_status: string;
  lead_status: string;
  diag_date: string;
  report_link: string;
  schedule: string;
  teachers: string;
  comment: string;
  source: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeadsStats {
  total: number;
  clients: number;
  diag_count: number;
  conv_to_diag: number;
  conv_to_client: number;
  by_lead_status: Record<string, number>;
  by_processing: Record<string, number>;
  by_month: Record<string, number>;
}

export const RESPONSIBLE_OPTIONS = ['Абраменко Виктория', 'Зинченко Ирина'];

export const PROCESSING_OPTIONS = [
  'Списались (ответ не получен)',
  'Списались (ответ получен)',
  'Заполнена анкета',
  'Запланирована диагностика (не оплачено)',
  'Запланирована диагностика (оплачено)',
  'Проведена диагностика',
  'Утверждено расписание',
  'Оплачен абонемент',
  'Клиент добавлен в мессенджер',
];

export const LEAD_STATUS_OPTIONS = [
  'лид в работе',
  'клиент',
  'нецелевой лид',
  'лид не вышел на связь',
  'норма развития',
  'отказ',
  'игнор',
];

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const t = getStaffToken();
  if (t) h['X-Auth-Token'] = t;
  return h;
}

export async function fetchLeads(): Promise<Lead[]> {
  const res = await fetch(URL, { headers: headers() });
  if (!res.ok) return [];
  const data = await res.json();
  return data.leads || [];
}

export async function fetchLeadsStats(): Promise<LeadsStats | null> {
  const res = await fetch(`${URL}?action=stats`, { headers: headers() });
  if (!res.ok) return null;
  return res.json();
}

export async function createLead(lead: Partial<Lead>): Promise<number | null> {
  const res = await fetch(URL, { method: 'POST', headers: headers(), body: JSON.stringify(lead) });
  if (!res.ok) return null;
  const data = await res.json();
  return data.id ?? null;
}

export async function updateLead(id: number, patch: Partial<Lead>): Promise<boolean> {
  const res = await fetch(URL, { method: 'PUT', headers: headers(), body: JSON.stringify({ id, ...patch }) });
  return res.ok;
}

export async function deleteLead(id: number): Promise<boolean> {
  const res = await fetch(URL, { method: 'DELETE', headers: headers(), body: JSON.stringify({ id }) });
  return res.ok;
}
