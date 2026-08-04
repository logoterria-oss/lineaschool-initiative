import { InterimPrimaryData } from './InterimPersonalDataSection';
import { ProcessDynamic } from './impairedProcesses';

// Ключи показателей, у которых есть сравнение «было → стало»
export type RWMetric =
  | 'readingSpeed'
  | 'readingComprehension'
  | 'dysgraphicErrors'
  | 'dysorthographicErrors';

// Состояние раздела «Чтение и письмо», которое заполняет логопед на промежуточной
export interface ReadingWritingState {
  readingSpeed: string; // сл/мин
  readingComprehension: string; // %
  readingErrorTypes: string; // тип ошибок (рукописный ввод)
  writingSamples: string[]; // изображения (base64/URL)
  dysgraphicErrors: string; // количество
  dysorthographicErrors: string; // количество
  // Ручной ввод «было», когда в первичной данных нет
  baselineOverride: Partial<Record<RWMetric, string>>;
}

// Значения «было» из первичной диагностики
export interface ReadingWritingBaseline {
  readingSpeed: string;
  readingComprehension: string;
  dysgraphicErrors: string;
  dysorthographicErrors: string;
}

export const EMPTY_RW_STATE: ReadingWritingState = {
  readingSpeed: '',
  readingComprehension: '',
  readingErrorTypes: '',
  writingSamples: [],
  dysgraphicErrors: '',
  dysorthographicErrors: '',
  baselineOverride: {},
};

// Эффективное «было»: данные из первичной, а если их нет — ручной ввод логопеда
export function effectiveBaseline(
  metric: RWMetric,
  baseline: ReadingWritingBaseline,
  state: ReadingWritingState,
): string {
  const fromPrimary = (baseline[metric] || '').trim();
  if (fromPrimary !== '') return fromPrimary;
  return (state.baselineOverride?.[metric] || '').trim();
}

// Есть ли значение «было» из первичной (тогда ручной ввод не нужен)
export function hasPrimaryBaseline(metric: RWMetric, baseline: ReadingWritingBaseline): boolean {
  return (baseline[metric] || '').trim() !== '';
}

export function baselineFromPrimary(p: InterimPrimaryData | undefined): ReadingWritingBaseline {
  return {
    readingSpeed: p?.readingSpeed || '',
    readingComprehension: p?.readingComprehension || '',
    dysgraphicErrors: p?.dysgraphicErrors || '',
    dysorthographicErrors: p?.dysorthographicErrors || '',
  };
}

function toNum(v: string): number | null {
  const s = (v || '').toString().replace(',', '.').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Динамика для показателей, где БОЛЬШЕ = ЛУЧШЕ (скорость чтения, понимание).
 * Рост — прогресс (up), снижение — регресс (down).
 */
export function dynamicMoreIsBetter(from: string, to: string): ProcessDynamic {
  const a = toNum(from);
  const b = toNum(to);
  if (a === null || b === null) return 'same';
  if (b > a) return 'up';
  if (b < a) return 'down';
  return 'same';
}

/**
 * Динамика для показателей ошибок, где МЕНЬШЕ = ЛУЧШЕ.
 * Снижение количества ошибок — прогресс (up), рост — регресс (down).
 */
export function dynamicFewerIsBetter(from: string, to: string): ProcessDynamic {
  const a = toNum(from);
  const b = toNum(to);
  if (a === null || b === null) return 'same';
  if (b < a) return 'up';
  if (b > a) return 'down';
  return 'same';
}

/**
 * Подсказка о качестве ошибок: дисграфических стало меньше,
 * а орфографических (дизорфографических) — больше. Это показатель прогресса.
 */
export function errorQualityHint(
  baseline: ReadingWritingBaseline,
  state: ReadingWritingState,
): string {
  const dysgraphicBase = effectiveBaseline('dysgraphicErrors', baseline, state);
  const orthographicBase = effectiveBaseline('dysorthographicErrors', baseline, state);
  const dysgraphicDown = dynamicFewerIsBetter(dysgraphicBase, state.dysgraphicErrors) === 'up';
  const orthographicUp =
    dynamicFewerIsBetter(orthographicBase, state.dysorthographicErrors) === 'down';
  if (dysgraphicDown && orthographicUp) {
    return 'Изменение качества ошибок, т.е. уменьшение количества дисграфических с увеличением количества орфографических, — показатель прогресса!';
  }
  return '';
}