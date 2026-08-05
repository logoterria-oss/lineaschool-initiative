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

// Подпись шага: первичная → 1-я, 2-я … промежуточная → сейчас
export function stepLabel(idx: number, total: number): string {
  if (idx === 0) return 'Первичная';
  if (idx === total - 1) return 'Сейчас';
  return `${idx}-я промежуточная`;
}

function withLabels(raw: { date: string | null; value: string }[]): ConclusionStep[] {
  const total = raw.length;
  return raw.map((s, idx) => ({ ...s, label: stepLabel(idx, total) }));
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
  (history || []).forEach((h) => {
    const v = h.levels?.[key];
    if (v) raw.push({ date: h.date, value: v });
  });
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
  (history || []).forEach((h) => {
    const v = (h[metric] as string) || '';
    if (v) raw.push({ date: h.date, value: v });
  });
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
  (history || []).forEach((h) => {
    if (h.readingChar) raw.push({ date: h.date, value: h.readingChar });
  });
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
