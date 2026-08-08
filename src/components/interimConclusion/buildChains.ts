import {
  ImpairedProcessKey,
  ProcessDynamic,
  ProcessLevel,
  PROCESS_LEVELS,
} from '@/components/interimDiag/impairedProcesses';
import { RWMetric, readingCharIndex } from '@/components/interimDiag/readingWriting';
import { rateLabel } from '@/components/interimDiag/errorRate';
import { ConclusionStep } from './ConclusionChain';

export interface InterimHistoryItem {
  date: string | null;
  levels?: Record<string, string>;
  readingSpeed?: string;
  readingComprehension?: string;
  dictationWords?: string;
  dysgraphicErrors?: string;
  dysorthographicErrors?: string;
  totalErrors?: string;
  readingChar?: string;
}

// Откуда взят замер. Подпись зависит именно от источника, а не от позиции:
// если в первичной диагностике показатель не заполнен, цепочка начинается
// с промежуточной, и её нельзя подписывать «Первичная».
type StepKind = 'primary' | 'previous' | 'current';

const STEP_LABELS: Record<StepKind, string> = {
  primary: 'Первичная',
  previous: 'Предыдущая',
  current: 'Сейчас',
};

interface RawStep {
  date: string | null;
  value: string;
  kind: StepKind;
}

function withLabels(raw: RawStep[]): ConclusionStep[] {
  return raw.map((s) => ({
    date: s.date,
    value: s.value,
    label: STEP_LABELS[s.kind],
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
): RawStep | null {
  const filled = (history || [])
    .map((h) => ({ date: h.date, value: (getValue(h) || '').trim(), kind: 'previous' as StepKind }))
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
  const raw: RawStep[] = [];
  const base = baseline?.[key];
  if (base) raw.push({ date: primaryDate, value: base, kind: 'primary' });
  const prev = previousMeasure(history, (h) => h.levels?.[key] || '');
  if (prev) raw.push(prev);
  const cur = current?.[key];
  if (cur) raw.push({ date: todayDate, value: cur, kind: 'current' });
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
  const raw: RawStep[] = [];
  if (baseline) raw.push({ date: primaryDate, value: baseline, kind: 'primary' });
  const prev = previousMeasure(history, (h) => (h[metric] as string) || '');
  if (prev) raw.push(prev);
  if (current) raw.push({ date: todayDate, value: current, kind: 'current' });
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

export type ErrorMetric = 'dysgraphicErrors' | 'dysorthographicErrors' | 'totalErrors';

/**
 * Цепочка ошибок в пересчёте на 100 слов.
 * Абсолютные числа несопоставимы между диктантами разной длины,
 * поэтому каждый замер приводим к общей базе — «ошибок на 100 слов».
 * Если объём работы у замера не указан, показываем абсолютное число.
 */
export function errorRateChain(
  metric: ErrorMetric,
  baseline: Record<string, string>,
  history: InterimHistoryItem[],
  current: Record<string, string>,
  primaryDate: string | null,
  todayDate: string | null,
): ConclusionStep[] {
  const raw: RawStep[] = [];

  const base = (baseline?.[metric] || '').trim();
  if (base) {
    raw.push({
      date: primaryDate,
      value: rateLabel(base, baseline?.dictationWords),
      kind: 'primary',
    });
  }

  const filled = (history || []).filter((h) => ((h[metric] as string) || '').trim() !== '');
  if (filled.length > 0) {
    const sorted = [...filled].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const last = sorted[sorted.length - 1];
    raw.push({
      date: last.date,
      value: rateLabel((last[metric] as string) || '', last.dictationWords),
      kind: 'previous',
    });
  }

  const cur = (current?.[metric] || '').trim();
  if (cur) {
    raw.push({
      date: todayDate,
      value: rateLabel(cur, current?.dictationWords),
      kind: 'current',
    });
  }

  return withLabels(raw);
}

/**
 * Динамика по плотности ошибок между двумя последними шагами цепочки.
 * Числа уже пересчитаны на 100 слов, поэтому сравниваем их напрямую.
 */
export function errorRateDynamic(steps: ConclusionStep[]): ProcessDynamic {
  if (steps.length < 2) return 'same';
  // В шаге лежит текст вида «12,5 на 100 слов» — берём число из начала
  const lead = (v: string): number | null => {
    const m = (v || '').replace(',', '.').match(/-?\d+(\.\d+)?/);
    return m ? Number(m[0]) : null;
  };
  const a = lead(steps[steps.length - 2].value);
  const b = lead(steps[steps.length - 1].value);
  if (a === null || b === null || a === b) return 'same';
  return b < a ? 'up' : 'down';
}

// Цепочка характера чтения
export function readingCharChain(
  baseline: string,
  history: InterimHistoryItem[],
  current: string,
  primaryDate: string | null,
  todayDate: string | null,
): ConclusionStep[] {
  const raw: RawStep[] = [];
  if (baseline) raw.push({ date: primaryDate, value: baseline, kind: 'primary' });
  const prev = previousMeasure(history, (h) => h.readingChar || '');
  if (prev) raw.push(prev);
  if (current) raw.push({ date: todayDate, value: current, kind: 'current' });
  return withLabels(raw);
}

export function readingCharDynamic(steps: ConclusionStep[]): ProcessDynamic {
  if (steps.length < 2) return 'same';
  const a = readingCharIndex(steps[steps.length - 2].value);
  const b = readingCharIndex(steps[steps.length - 1].value);
  if (a < 0 || b < 0 || a === b) return 'same';
  return b > a ? 'up' : 'down';
}