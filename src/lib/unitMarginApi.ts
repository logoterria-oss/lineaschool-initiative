import func2url from '../../backend/func2url.json';
import type { UnitMarginInputs, UnitMarginResults } from './unitMarginModel';

const API = (func2url as Record<string, string>)['unit-margin'];

/** Факт месяца по одной форме занятий. */
export interface UnitFactSide {
  /** Сколько занятий проведено. */
  lessons: number;
  /** Всего мест на занятиях (строк в details). */
  units: number;
  /** Мест со списанием — именно они приносят выручку. */
  paid_units: number;
  /** Мест без списания: отработки, бонусы, уважительные пропуски. */
  free_units: number;
  students: number;
  revenue: number;
  /** Средняя оплата одного ОПЛАЧЕННОГО места. */
  avg_price: number;
  /** Сколько денег приносит одно занятие по факту. */
  revenue_per_lesson: number;

  /* Посещаемость и пропуски (is_attend из CRM). */
  /** Сколько детей реально были на занятиях. */
  attended_units: number;
  /** Сколько пропусков всего. */
  missed_units: number;
  /** Пропуски со списанием — неуважительные, их оплатили. */
  missed_charged: number;
  /** Деньги, полученные со списанных прогулов. */
  missed_charged_revenue: number;
  /** Пропуски без списания — уважительные. */
  missed_free: number;
  /** Доля выручки, пришедшая с прогулов, %. */
  missed_revenue_share: number;

  /** Оплаченная наполняемость: оплаченных мест на одно занятие. */
  avg_group_size: number;
  /** Физическая наполняемость: сколько человек записано на занятие. */
  avg_present_size: number;
}

export interface UnitFactTeacher {
  teacher_id: number;
  name: string;
  group_lessons: number;
  group_units: number;
  group_paid_units: number;
  group_revenue: number;
  individual_lessons: number;
  individual_units: number;
  individual_paid_units: number;
  individual_revenue: number;
  /** Оплаченных мест на одно групповое занятие. */
  avg_group_size: number;
  /** Физически записанных на занятие. */
  avg_present_size: number;
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