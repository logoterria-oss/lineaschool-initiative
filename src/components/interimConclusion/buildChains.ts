import {
  ImpairedProcessKey,
  ProcessDynamic,
  ProcessLevel,
  PROCESS_LEVELS,
} from '@/components/interimDiag/impairedProcesses';
import { RWMetric, readingCharIndex } from '@/components/interimDiag/readingWriting';
import { ConclusionStep } from './ConclusionChain';

export interface InterimHistoryItem {
  date: string | null;
  levels?: Record<string, string>;
  readingSpeed?: string;
  readingComprehension?: string;
  dysgraphicErrors?: string;
  dysorthographicErrors?: string;
  totalErrors?: string;
  readingChar?: string;
}

// Подпись шага: первичная → предыдущая промежуточная → сейчас.
// В цепочке максимум 3 замера, поэтому нумерация не нужна.
export function stepLabel(idx: number, total: number): string {
  if (idx === 0) return 'Первичная';
  if (idx === total - 1) return 'Сейчас';
  return 'Предыдущая';
}

// Короткая подпись для печати
export function stepLabelShort(idx: number, total: number): string {
  if (idx === 0) return 'Первичная';
  if (idx === total - 1) return 'Сейчас';
  return 'Предыдущая';
}

function withLabels(raw: { date: string | null; value: string }[]): ConclusionStep[] {
  const total = raw.length;
  return raw.map((s, idx) => ({
    ...s,
    label: stepLabel(idx, total),
    labelShort: stepLabelShort(idx, total),
  }));
}

/**
 * Последняя по дате промежуточная диагностика, в которой показатель заполнен.
 * В заключении показываем только её: первичная → предыдущая → сейчас.
 * Если предыдущих промежуточных не было, вернёт null и в цепочке будет 2 замера.
 */
function previousMeasure(
  history: InterimHistoryItem[],
  getValue: (h: InterimHistoryItem) => string,
): { date: string | null; value: string } | null {
  const filled = (history || [])
    .map((h) => ({ date: h.date, value: (getValue(h) || '').trim() }))
    .filter((h) => h.value !== '');
  if (filled.length === 0) return null;

  // История может прийти неотсортированной — берём самую свежую по дате
  const sorted = [...filled].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  return sorted[sorted.length - 1];
}

// Цепочка уровней одного нарушенного процесса
export function processChain(
  key: ImpairedProcessKey,
  baseline: Record<string, string>,
  history: InterimHistoryItem[],
  current: Record<string, string>,
  primaryDate: string | null,
  todayDate: string | null,
): ConclusionStep[] {
  const raw: { date: string | null; value: string }[] = [];
  const base = baseline?.[key];
  if (base) raw.push({ date: primaryDate, value: base });
  const prev = previousMeasure(history, (h) => h.levels?.[key] || '');
  if (prev) raw.push(prev);
  const cur = current?.[key];
  if (cur) raw.push({ date: todayDate, value: cur });
  return withLabels(raw);
}

export function processDynamic(steps: ConclusionStep[]): ProcessDynamic {
  if (steps.length < 2) return 'same';
  const a = PROCESS_LEVELS.indexOf(steps[steps.length - 2].value as ProcessLevel);
  const b = PROCESS_LEVELS.indexOf(steps[steps.length - 1].value as ProcessLevel);
  if (a < 0 || b < 0 || a === b) return 'same';
  return b > a ? 'up' : 'down';
}

// Цепочка числового показателя чтения и письма
export function metricChain(
  metric: RWMetric,
  baseline: string,
  history: InterimHistoryItem[],
  current: string,
  primaryDate: string | null,
  todayDate: string | null,
): ConclusionStep[] {
  const raw: { date: string | null; value: string }[] = [];
  if (baseline) raw.push({ date: primaryDate, value: baseline });
  const prev = previousMeasure(history, (h) => (h[metric] as string) || '');
  if (prev) raw.push(prev);
  if (current) raw.push({ date: todayDate, value: current });
  return withLabels(raw);
}

function toNum(v: string): number | null {
  const n = Number((v || '').replace(',', '.').trim());
  return Number.isFinite(n) && (v || '').trim() !== '' ? n : null;
}

export function metricDynamic(steps: ConclusionStep[], moreIsBetter: boolean): ProcessDynamic {
  if (steps.length < 2) return 'same';
  const a = toNum(steps[steps.length - 2].value);
  const b = toNum(steps[steps.length - 1].value);
  if (a === null || b === null || a === b) return 'same';
  return (moreIsBetter ? b > a : b < a) ? 'up' : 'down';
}

// Цепочка характера чтения
export function readingCharChain(
  baseline: string,
  history: InterimHistoryItem[],
  current: string,
  primaryDate: string | null,
  todayDate: string | null,
): ConclusionStep[] {
  const raw: { date: string | null; value: string }[] = [];
  if (baseline) raw.push({ date: primaryDate, value: baseline });
  const prev = previousMeasure(history, (h) => h.readingChar || '');
  if (prev) raw.push(prev);
  if (current) raw.push({ date: todayDate, value: current });
  return withLabels(raw);
}

export function readingCharDynamic(steps: ConclusionStep[]): ProcessDynamic {
  if (steps.length < 2) return 'same';
  const a = readingCharIndex(steps[steps.length - 2].value);
  const b = readingCharIndex(steps[steps.length - 1].value);
  if (a < 0 || b < 0 || a === b) return 'same';
  return b > a ? 'up' : 'down';
}