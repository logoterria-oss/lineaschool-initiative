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
  contact_when?: string;
  source: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_page?: string;
  referrer?: string;
  status_changed_at?: string | null;
  archived?: boolean;
  archived_at?: string | null;
  no_contact_stage?: string;
  crm_diag_planned_at?: string;
  crm_diag_done_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignRow {
  name: string;
  source?: string;
  medium?: string;
  total: number;
  diag: number;
  clients: number;
  conv_to_diag: number;
  conv_to_client: number;
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
  by_responsible: Record<string, number>;
  by_campaign?: CampaignRow[];
  by_source?: CampaignRow[];
  by_content?: CampaignRow[];
  from: string;
  to: string;
}

export const RESPONSIBLE_OPTIONS = ['Абраменко Виктория', 'Зинченко Ирина'];

export const PROCESSING_OPTIONS = [
  'Списались в "Окне" (ответ не получен)',
  'Списались в "Окне" (ответ получен)',
  'Заполнена анкета',
  'Запланирована диагностика (не оплачено)',
  'Запланирована диагностика (оплачено)',
  'Проведена диагностика',
  'Утверждено расписание',
  'Оплачен абонемент',
  'Клиент добавлен в мессенджер',
];

export const NO_CONTACT_STATUS = 'Связь через "Окно" не налажена';
export const NO_CONTACT_FINAL = 'лид не вышел на связь';
export const NO_REPLY_PROCESSING = 'Списались в "Окне" (ответ не получен)';

/** Статус «Связь не налажена» доступен только неразобранным и тем, кто не ответил в «Окне». */
export function canHaveNoContact(processing: string): boolean {
  const p = (processing || '').trim();
  return p === '' || p === NO_REPLY_PROCESSING;
}

/** Этапы дозвона: у не ответивших в «Окне» первым идёт сообщение в «Окно». */
export function noContactStages(processing: string): string[] {
  const base = ['отправлено СМС', 'звонок 1', 'звонок 2', NO_CONTACT_FINAL];
  return (processing || '').trim() === NO_REPLY_PROCESSING
    ? ['Отправлено сообщение в "Окно"', ...base]
    : base;
}

export const IN_WORK_STATUS = 'лид в работе';
export const STUCK_STATUS = 'завис на этапе';
export const CLIENT_STATUS = 'клиент';
export const CLOSING_STATUSES = ['нецелевой лид', 'норма развития', 'отказ', 'игнор'];
const CLIENT_STAGES = ['Оплачен абонемент', 'Клиент добавлен в мессенджер'];

/** Можно ли очистить статус лида (пустое значение) на этом этапе. */
export function leadStatusClearable(processing: string): boolean {
  return (processing || '').trim() === '';
}

/** Какие статусы лида доступны на этом этапе воронки. Закрывающие отправляют лида в архив. */
export function leadStatusOptions(processing: string): string[] {
  const p = (processing || '').trim();
  if (p === '' || p === NO_REPLY_PROCESSING) return [NO_CONTACT_STATUS];
  if (CLIENT_STAGES.includes(p)) return [CLIENT_STATUS];
  return [IN_WORK_STATUS, ...CLOSING_STATUSES];
}

/** Есть ли что выбирать вручную: если вариант один и он уже стоит — список не нужен. */
export function leadStatusEditable(processing: string, current: string): boolean {
  if (leadStatusClearable(processing)) return true;
  if (CLIENT_STAGES.includes((processing || '').trim())) return false;
  return leadStatusOptions(processing).some((o) => o !== current);
}

/** Дата диагностики из CRM для карточки: запланированная или проведённая — по этапу. */
export function diagDateLabel(l: Lead): { label: string; value: string } | null {
  const p = (l.processing_status || '').trim();
  const fmt = (v?: string) => {
    const m = (v || '').match(/^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}:\d{2}))?/);
    return m ? `${m[3]}.${m[2]}.${m[1].slice(2)}${m[4] ? ` ${m[4]}` : ''}` : '';
  };
  if (p.startsWith('Запланирована диагностика')) {
    const v = fmt(l.crm_diag_planned_at);
    return v ? { label: 'Диагностика', value: v } : null;
  }
  if (p === 'Проведена диагностика') {
    const v = fmt(l.crm_diag_done_at);
    return v ? { label: 'Провели диаг.', value: v } : null;
  }
  return null;
}

/** Варианты для выпадающего списка: текущее значение показываем, даже если вручную его не выбрать. */
export function leadStatusChoices(processing: string, current: string): string[] {
  const opts = leadStatusOptions(processing);
  return current && !opts.includes(current) ? [current, ...opts] : opts;
}

/** Статус лида, который ставится автоматически при переходе на этап. */
export function defaultLeadStatus(processing: string, current: string): string {
  const p = (processing || '').trim();
  if (p === '') return current === NO_CONTACT_STATUS ? current : '';
  if (p === NO_REPLY_PROCESSING) return NO_CONTACT_STATUS;
  if (CLIENT_STAGES.includes(p)) return CLIENT_STATUS;
  return IN_WORK_STATUS;
}

export const LEAD_STATUS_OPTIONS = [
  'лид в работе',
  'завис на этапе',
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

export async function fetchLeadsStats(from = '', to = ''): Promise<LeadsStats | null> {
  const q = new URLSearchParams({ action: 'stats' });
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  const res = await fetch(`${URL}?${q.toString()}`, { headers: headers() });
  if (!res.ok) return null;
  return res.json();
}

export async function createLead(lead: Partial<Lead>): Promise<number | null> {
  const res = await fetch(URL, { method: 'POST', headers: headers(), body: JSON.stringify(lead) });
  if (!res.ok) return null;
  const data = await res.json();
  return data.id ?? null;
}

export interface LeadUpdateResult {
  lead_status?: string | null;
  archived?: boolean | null;
  archived_at?: string | null;
  status_changed_at?: string | null;
}

/** Сохраняет поля и возвращает итог после автоправил (статус лида, архив). */
export async function updateLeadRules(id: number, patch: Partial<Lead>): Promise<LeadUpdateResult | null> {
  const res = await fetch(URL, { method: 'PUT', headers: headers(), body: JSON.stringify({ id, ...patch }) });
  if (!res.ok) return null;
  return res.json();
}

export async function updateLead(id: number, patch: Partial<Lead>): Promise<boolean> {
  const res = await fetch(URL, { method: 'PUT', headers: headers(), body: JSON.stringify({ id, ...patch }) });
  return res.ok;
}

/** Архив доски: лид уходит из колонок, но остаётся в таблице. */
export async function setLeadArchived(id: number, archived: boolean): Promise<boolean> {
  const res = await fetch(URL, { method: 'PUT', headers: headers(), body: JSON.stringify({ id, archived }) });
  return res.ok;
}

/** Смена статуса обработки; возвращает дату перехода в новую колонку. */
export async function moveLead(id: number, processing_status: string): Promise<LeadUpdateResult | null> {
  return updateLeadRules(id, { processing_status });
}


const FUNNEL_SYNC_URL = (func2url as Record<string, string>)['lead-funnel-sync'];
const PAYMENT_SYNC_URL = (func2url as Record<string, string>)['mail-payment-sync'];

// Подтягиваем статусы из CRM («Проведено») и банка (оплата диагностики).
// Возвращает число лидов, которые сдвинулись по воронке.
export async function syncLeadFunnel(): Promise<number> {
  const run = async (url?: string) => {
    if (!url) return 0;
    try {
      const r = await fetch(url);
      const d = await r.json();
      return Number(d?.moved || d?.matched || 0);
    } catch {
      return 0;
    }
  };
  const [paid, done] = await Promise.all([run(PAYMENT_SYNC_URL), run(FUNNEL_SYNC_URL)]);
  return paid + done;
}
