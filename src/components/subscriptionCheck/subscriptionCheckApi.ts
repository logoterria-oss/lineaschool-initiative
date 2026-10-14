import func2url from '../../../backend/func2url.json';
import { getStaffToken } from '@/lib/staffApi';

const API = (func2url as Record<string, string>)['crm-subscription-check'];

export type CheckStatus = 'ok' | 'warn' | 'error' | 'pending';

export interface CheckIssue {
  code: string;
  text: string;
  level?: 'warn' | 'error';
  diff?: number;
}

export interface TariffInfo {
  name: string;
  price: number | null;
  since: string;
  till: string | null;
  archive: boolean;
}

export interface CheckRow {
  key: string;
  source: 'ours' | 'crm_only';
  customerId: number | null;
  student: string;
  date: string;
  amount: number;
  plan: string;
  paySource: string;
  kind?: 'diagnostic' | 'subscription';
  crmPay: { id: number; date: string; amount: number; payer: string } | null;
  tariffAtPayment?: TariffInfo | null;
  tariffNow?: TariffInfo | null;
  expectedTariff?: string;
  expectedLessonPrice?: number[];
  wrongLessons?: { date: string; charged: number; tariff: string }[];
  issues: CheckIssue[];
  status: CheckStatus;
  checked: boolean;
  retry?: boolean;
}

const headers = () => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const t = getStaffToken();
  if (t) h['X-Auth-Token'] = t;
  return h;
};

export async function loadPayments(month: string) {
  const r = await fetch(`${API}?month=${month}`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || data.errorMessage || 'Не удалось загрузить оплаты');
  return data as { rows: CheckRow[]; tariffs: unknown[] };
}

export async function checkBatch(rows: CheckRow[], tariffs: unknown[]): Promise<CheckRow[]> {
  const r = await fetch(`${API}?action=check`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ rows, tariffs }),
  });
  const data = await r.json();
  if (!r.ok || !data.rows) throw new Error(data.error || data.errorMessage || 'CRM не ответила');
  return data.rows as CheckRow[];
}
