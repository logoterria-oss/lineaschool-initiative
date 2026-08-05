import { IMPAIRED_GROUPS, ProcessLevelsState } from './impairedProcesses';

export const API = 'https://functions.poehali.dev/12cd04f4-07fb-4fe5-a260-e3c9955e0ae7';

// По умолчанию все процессы считаем нормой — логопед меняет только нарушенные
export function defaultLevels(): ProcessLevelsState {
  const out: ProcessLevelsState = {};
  IMPAIRED_GROUPS.forEach((g) => g.items.forEach((it) => (out[it.key] = 'норма')));
  return out;
}

export interface PastEntry {
  id: number;
  diagType: 'primary' | 'interim';
  date: string | null;
  readingSpeed: string;
  readingComprehension: string;
  dysgraphicErrors: string;
  dysorthographicErrors: string;
  totalErrors: string;
  readingChar: string;
  readingErrorTypes: string[];
  errorTypes: string[];
  orthoErrorTypes: string[];
  levels: ProcessLevelsState;
}

// Пустая заготовка новой записи (уровни — «норма» по умолчанию)
export function emptyEntry(): Omit<PastEntry, 'id'> {
  return { ...EMPTY, levels: defaultLevels() };
}

export const EMPTY: Omit<PastEntry, 'id'> = {
  diagType: 'interim',
  date: '',
  readingSpeed: '',
  readingComprehension: '',
  dysgraphicErrors: '',
  dysorthographicErrors: '',
  totalErrors: '',
  readingChar: '',
  readingErrorTypes: [],
  errorTypes: [],
  orthoErrorTypes: [],
  levels: {},
};