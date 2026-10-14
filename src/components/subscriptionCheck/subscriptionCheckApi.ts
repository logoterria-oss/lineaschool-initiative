import func2url from '../../../backend/func2url.json';
import { getStaffToken } from '@/lib/staffApi';

const API = (func2url as Record<string, string>)['crm-subscription-check'];

export type CheckStatus = 'ok' | 'error' | 'pending';

export interface PayInfo {
  date: string;
  amount: number;
  plan?: string;
}

export interface TariffInfo {
  name: string;
  price: number | null;
  perLesson: number | null;
  since: string;
  till: string | null;
  expired?: boolean;
}

export interface CheckRow {
  customerId: number;
  student: string;
  ourPay: PayInfo | null;
  crmPay: PayInfo | null;
  tariffNow?: TariffInfo | null;
  tariffNext?: TariffInfo | null;
  expectedTariff?: string | null;
  lastLesson?: { date: string; charged: number; expected: number | null } | null;
  issues: string[];
  status: CheckStatus;
  checked: boolean;
}

const headers = () => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const t = getStaffToken();
  if (t) h['X-Auth-Token'] = t;
  return h;
};

export async function loadStudents() {
  const r = await fetch(API, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error === 'unauthorized' ? 'Войдите заново' : 'CRM не ответила, попробуйте позже');
  return data as { rows: CheckRow[]; tariffs: unknown[] };
}

export async function checkBatch(rows: CheckRow[], tariffs: unknown[], refresh: boolean): Promise<CheckRow[]> {
  const r = await fetch(`${API}?action=check${refresh ? '&refresh=1' : ''}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ rows, tariffs }),
  });
  const data = await r.json();
  if (!r.ok || !data.rows) throw new Error('CRM не ответила');
  return data.rows as CheckRow[];
}
