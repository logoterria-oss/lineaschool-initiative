import func2url from '../../backend/func2url.json';
import type { UnitMarginInputs, UnitMarginResults } from './unitMarginModel';

const API = (func2url as Record<string, string>)['unit-margin'];

/** Факт месяца по одной форме занятий. */
export interface UnitFactSide {
  /** Сколько занятий проведено. */
  lessons: number;
  /** Сколько юнитов: для группы — списаний (ученико-уроков). */
  units: number;
  paid_units: number;
  free_units: number;
  students: number;
  revenue: number;
  /** Средняя цена юнита по всем спискам, включая бесплатные отработки. */
  avg_price: number;
  /** Средняя цена только по платным спискам. */
  avg_price_paid: number;
  avg_group_size: number;
}

export interface UnitFactTeacher {
  teacher_id: number;
  name: string;
  group_lessons: number;
  group_units: number;
  group_revenue: number;
  individual_lessons: number;
  individual_units: number;
  individual_revenue: number;
  avg_group_size: number;
}

export interface UnitFact {
  month: string;
  individual: UnitFactSide;
  group: UnitFactSide;
  teachers: UnitFactTeacher[];
  diag_lessons: number;
  lessons_total: number;
}

export interface UnitMarginReport {
  id: number;
  period_month: string;
  title: string;
  inputs: UnitMarginInputs;
  result: UnitMarginResults;
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

export const fetchUnitFact = async (
  month: string,
  refresh = false,
): Promise<UnitFact> =>
  (await get(`?action=fact&month=${month}${refresh ? '&refresh=1' : ''}`)).data;

export const fetchUnitDefaults = async (): Promise<Partial<UnitMarginInputs> | null> =>
  (await get('?action=defaults')).defaults;

export const fetchUnitReports = async (): Promise<UnitMarginReport[]> =>
  (await get('?action=reports')).reports || [];

export interface SaveUnitPayload {
  period_month: string;
  title: string;
  inputs: UnitMarginInputs;
  result: UnitMarginResults;
  note: string;
}

export const saveUnitReport = async (
  payload: SaveUnitPayload,
): Promise<UnitMarginReport> => (await post({ action: 'save', ...payload })).report;

export const deleteUnitReport = async (id: number): Promise<void> => {
  await post({ action: 'delete', id });
};

export const saveUnitDefaults = async (
  defaults: Partial<UnitMarginInputs>,
): Promise<void> => {
  await post({ action: 'save_defaults', defaults });
};
