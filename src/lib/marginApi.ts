import func2url from '../../backend/func2url.json';
import type { MarginInputs, MarginResult } from './marginModel';

const API = (func2url as Record<string, string>)['subscription-margin'];

/** Абонемент из справочника CRM — и действующий, и архивный. */
export interface CrmTariff {
  id: number;
  name: string;
  short_name: string;
  price: number;
  lessons_count: number;
  price_per_lesson: number;
  is_archived: boolean;
  is_active: boolean;
  per_week: number | null;
  months: number | null;
  composition: { group: number; individual: number } | null;
}

export interface CrmTeacherFact {
  teacher_id: number;
  name: string;
  group: number;
  individual: number;
  avg_group_size: number;
}

/** Факт месяца по одному абонементу. */
export interface CrmTariffFact {
  tariff_id: number;
  name: string;
  short_name: string;
  is_archived: boolean;
  price: number;
  lessons_count: number;
  price_per_lesson: number;
  per_week: number | null;
  months: number | null;
  composition: { group: number; individual: number } | null;
  students: number;
  group_student_lessons: number;
  individual_student_lessons: number;
  student_lessons: number;
  revenue: number;
  avg_group_size: number;
  teachers: CrmTeacherFact[];
}

export interface CrmMonth {
  month: string;
  total_revenue: number;
  total_student_lessons: number;
  total_lessons: number;
  diag_lessons: number;
  students_total: number;
  tariffs: Record<string, CrmTariffFact>;
}

export interface MarginReport {
  id: number;
  title: string;
  tariff_key: string;
  tariff_name: string;
  period_month: string;
  inputs: MarginInputs;
  result: MarginResult;
  note: string;
  author: string;
  created_at: string;
  updated_at: string;
}

const get = async (query: string) => {
  const r = await fetch(`${API}${query}`);
  const d = await r.json();
  if (!d?.success) throw new Error(d?.error || 'Не удалось загрузить данные');
  return d;
};

const post = async (body: object) => {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!d?.success) throw new Error(d?.error || 'Не удалось сохранить');
  return d;
};

export const fetchTariffs = async (): Promise<CrmTariff[]> =>
  (await get('?action=tariffs')).tariffs || [];

export const fetchCrmMonth = async (month: string, refresh = false): Promise<CrmMonth> =>
  (await get(`?action=crm&month=${month}${refresh ? '&refresh=1' : ''}`)).data;

export const fetchReports = async (): Promise<MarginReport[]> =>
  (await get('?action=reports')).reports || [];

export const fetchDefaults = async (): Promise<Partial<MarginInputs> | null> =>
  (await get('?action=defaults')).defaults;

export interface SavePayload {
  title: string;
  tariff_key: string;
  tariff_name: string;
  period_month: string;
  inputs: MarginInputs;
  result: MarginResult;
  note: string;
  author?: string;
}

export const saveReport = async (payload: SavePayload): Promise<MarginReport> =>
  (await post({ action: 'save', ...payload })).report;

export const updateReport = async (id: number, payload: SavePayload): Promise<MarginReport> =>
  (await post({ action: 'update', id, ...payload })).report;

export const deleteReport = async (id: number): Promise<void> => {
  await post({ action: 'delete', id });
};

export const saveDefaults = async (defaults: Partial<MarginInputs>): Promise<void> => {
  await post({ action: 'save_defaults', defaults });
};
