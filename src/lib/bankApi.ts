import func2url from '../../backend/func2url.json';

const API = (func2url as Record<string, string>)['bank-sync'];

export type BankCategory =
  | 'revenue' | 'variable' | 'fixed' | 'ano' | 'one_time' | 'tax' | 'interest' | 'body' | 'payout'
  | 'other' | 'transfer' | 'ignore' | 'uncategorized';

export const BANK_CATEGORY_LABEL: Record<BankCategory, string> = {
  revenue: 'Поступления',
  variable: 'Переменные',
  fixed: 'Постоянные',
  ano: 'АНО',
  one_time: 'Разовые',
  tax: 'Налог',
  interest: 'Кредит: проценты',
  body: 'Кредит: тело',
  payout: 'Выплата собственнику',
  other: 'Прочее',
  transfer: 'Перевод между своими счетами',
  ignore: 'Не учитывать',
  uncategorized: '— не разнесено —',
};

export const BANK_CATEGORIES = Object.keys(BANK_CATEGORY_LABEL) as BankCategory[];

export interface BankAccount {
  account: string;
  bank: 'tbank' | 'loko' | 'other';
  label: string;
  kind: 'business' | 'personal';
  use_in_cf: boolean;
  api: boolean;
  last_sync_at: string | null;
  last_sync_error: string;
  last_import_at: string | null;
  last_balance: { date: string; balance_end: number; source: string } | null;
}

export interface BankOperation {
  id: number;
  account: string;
  bank: string;
  op_date: string;
  doc_number: string;
  direction: 'in' | 'out';
  amount: number;
  counterparty: string;
  counterparty_inn: string;
  purpose: string;
  source: 'file' | 'api';
  category: BankCategory;
  category_source: 'rule' | 'manual' | 'none';
  rule_label: string | null;
}

export interface BankRule {
  id: number;
  sort: number;
  direction: 'in' | 'out' | 'any';
  field: 'purpose' | 'counterparty' | 'inn' | 'account';
  pattern: string;
  category: BankCategory;
  label: string;
  active: boolean;
}

export interface ManualFact {
  month_id: string;
  line: string;
  amount: number;
  note: string;
}

export interface BankMailLog {
  message_id: string;
  sender: string;
  subject: string;
  received_at: string | null;
  files: number;
  inserted: number;
  error: string;
  processed_at: string;
}

export interface BankData {
  mail_log: BankMailLog[];
  mail_senders: string;
  mail_checked_at: string | null;
  accounts: BankAccount[];
  months: { m: string; n: number; unc: number }[];
  month: string;
  operations: BankOperation[];
  rules: BankRule[];
  manual: ManualFact[];
  fact_from: string;
  tapi_configured: boolean;
  today: string;
}

const headers = (json = false): Record<string, string> => {
  const h: Record<string, string> = {};
  const token = localStorage.getItem('staff_token') || '';
  if (token) h['X-Auth-Token'] = token;
  if (json) h['Content-Type'] = 'application/json';
  return h;
};

const post = async (body: Record<string, unknown>) => {
  const r = await fetch(API, { method: 'POST', headers: headers(true), body: JSON.stringify(body) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
};

export const fetchBank = async (month?: string): Promise<BankData> => {
  const r = await fetch(`${API}?action=bank${month ? `&month=${month}` : ''}`, { headers: headers() });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
};

export const importStatement = (file: string) =>
  post({ action: 'import_1c', file }) as Promise<{ inserted: number; skipped: number; total: number; accounts: string[] }>;
export const syncTapi = () =>
  post({ action: 'sync_tapi' }) as Promise<{ accounts: { account: string; received?: number; inserted?: number; error?: string }[] }>;
export const setOperationCategory = (id: number, category: BankCategory, makeRule = false) =>
  post({ action: 'set_category', id, category, make_rule: makeRule });
export const resetOperationCategory = (id: number) => post({ action: 'set_category', id, category: 'uncategorized', reset: true });
export const saveBankRule = (r: Partial<BankRule>) => post({ action: 'save_rule', ...r });
export const deleteBankRule = (id: number) => post({ action: 'delete_rule', id });
export const setManualFact = (month: string, values: Record<string, number | null>, note = '') =>
  post({ action: 'set_manual', month, values, note });

export const checkBankMail = () =>
  post({ action: 'check_mail' }) as Promise<{ letters: number; inserted: number; items: { subject: string; files: number; inserted: number }[] }>;
/** Фоновая проверка почты при открытии финмодели: не чаще раза в 6 часов, иначе мгновенный ответ. */
export const checkBankMailIfStale = () =>
  post({ action: 'check_mail_if_stale' }) as Promise<{ skipped?: boolean; inserted: number }>;
export const setMailSenders = (senders: string) => post({ action: 'set_mail_senders', senders });
