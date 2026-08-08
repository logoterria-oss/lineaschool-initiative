import type { InterimPersonalData, InterimStudent } from './InterimPersonalDataSection';
import type { ImpairedProcessesState, ProcessLevelsState } from './impairedProcesses';
import type { InterimRecommendationsData } from './InterimRecommendationsSection';
import type { ReadingWritingBaseline, ReadingWritingState } from './readingWriting';

/** Полный снимок промежуточной диагностики для черновика */
export interface InterimDraft {
  personal: InterimPersonalData;
  impaired: ImpairedProcessesState;
  baseline: ProcessLevelsState;
  levels: ProcessLevelsState;
  primaryConclusion: string;
  studentSelected: boolean;
  history: InterimStudent['history'];
  primaryDate: string | null;
  primarySamples: string[];
  interimSamples: string[];
  interimSamplesDate: string | null;
  rwBaseline: ReadingWritingBaseline;
  rw: ReadingWritingState;
  recommendations: InterimRecommendationsData;
  autoFilled: boolean;
  /** Общий вывод о динамике: текст правки логопеда */
  summary: string;
  /** Трогал ли логопед текст — тогда автотекст не перетирает правку */
  summaryEdited: boolean;
}

/**
 * Пустой черновик не сохраняем: дата обследования подставляется
 * автоматически, поэтому судим по содержательным полям.
 */
export function isEmptyInterim(d: InterimDraft): boolean {
  if (d.personal?.childName?.trim()) return false;
  if (Object.values(d.impaired || {}).some(Boolean)) return false;
  if (d.primaryConclusion?.trim()) return false;
  if (d.recommendations?.teacherRecommendations?.trim()) return false;
  if (d.recommendations?.parentRecommendations?.trim()) return false;

  const rw = d.rw;
  if (rw) {
    const filled = [
      rw.readingSpeed,
      rw.readingComprehension,
      rw.dictationWords,
      rw.dysgraphicErrors,
      rw.dysorthographicErrors,
      rw.totalErrors,
      rw.readingChar,
    ].some((v) => (v || '').trim() !== '');
    if (filled) return false;
  }

  return true;
}
