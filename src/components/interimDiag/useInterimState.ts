import { useState } from 'react';
import type { InterimPersonalData, InterimStudent } from './InterimPersonalDataSection';
import type { ImpairedProcessesState, ProcessLevelsState } from './impairedProcesses';
import { EMPTY_IMPAIRED_STATE } from './impairedProcesses';
import type { InterimRecommendationsData } from './InterimRecommendationsSection';
import type { ReadingWritingBaseline, ReadingWritingState } from './readingWriting';
import { EMPTY_RW_STATE } from './readingWriting';
import type { InterimDraft } from './draft';

const today = () => new Date().toISOString().split('T')[0];

/**
 * Всё состояние формы промежуточной диагностики в одном месте.
 * Страница остаётся тонкой: она только собирает разделы и обработчики.
 */
export function useInterimState() {
  const [personal, setPersonal] = useState<InterimPersonalData>({
    childName: '',
    birthDate: '',
    age: '',
    grade: '',
    examDate: today(),
  });

  const [impaired, setImpaired] = useState<ImpairedProcessesState>({ ...EMPTY_IMPAIRED_STATE });
  const [baseline, setBaseline] = useState<ProcessLevelsState>({});
  const [levels, setLevels] = useState<ProcessLevelsState>({});
  const [primaryData, setPrimaryData] = useState<InterimStudent['primary']>(undefined);
  const [autoFilled, setAutoFilled] = useState(false);
  const [primaryConclusion, setPrimaryConclusion] = useState('');
  const [studentSelected, setStudentSelected] = useState(false);
  const [history, setHistory] = useState<InterimStudent['history']>([]);
  const [primaryDate, setPrimaryDate] = useState<string | null>(null);

  const [primarySamples, setPrimarySamples] = useState<string[]>([]);
  const [interimSamples, setInterimSamples] = useState<string[]>([]);
  const [interimSamplesDate, setInterimSamplesDate] = useState<string | null>(null);

  const [rwBaseline, setRwBaseline] = useState<ReadingWritingBaseline>({
    readingSpeed: '',
    readingComprehension: '',
    dictationWords: '',
    dysgraphicErrors: '',
    dysorthographicErrors: '',
    totalErrors: '',
    readingChar: '',
  });
  const [rw, setRw] = useState<ReadingWritingState>({ ...EMPTY_RW_STATE });

  const [recommendations, setRecommendations] = useState<InterimRecommendationsData>({
    teacherRecommendations: '',
    parentRecommendations: '',
    logopedist: '',
  });

  /** Дата текущей диагностики — логопед может её изменить */
  const todayDate = personal.examDate || today();

  /** Снимок всех разделов: используется для черновика и сохранения */
  const draftData: InterimDraft = {
    personal,
    impaired,
    baseline,
    levels,
    primaryConclusion,
    studentSelected,
    history: history || [],
    primaryDate,
    primarySamples,
    interimSamples,
    interimSamplesDate,
    rwBaseline,
    rw,
    recommendations,
    autoFilled,
  };

  /** Разложить готовый снимок обратно по разделам формы */
  const applyDraft = (d: InterimDraft) => {
    setPersonal(d.personal);
    setImpaired(d.impaired);
    setBaseline(d.baseline);
    setLevels(d.levels);
    setPrimaryConclusion(d.primaryConclusion);
    setStudentSelected(d.studentSelected);
    setHistory(d.history);
    setPrimaryDate(d.primaryDate);
    setPrimarySamples(d.primarySamples);
    setInterimSamples(d.interimSamples);
    setInterimSamplesDate(d.interimSamplesDate);
    setRwBaseline(d.rwBaseline);
    setRw(d.rw);
    setRecommendations(d.recommendations);
    setAutoFilled(d.autoFilled);
  };

  return {
    personal,
    setPersonal,
    impaired,
    setImpaired,
    baseline,
    setBaseline,
    levels,
    setLevels,
    primaryData,
    setPrimaryData,
    autoFilled,
    setAutoFilled,
    primaryConclusion,
    setPrimaryConclusion,
    studentSelected,
    setStudentSelected,
    history,
    setHistory,
    primaryDate,
    setPrimaryDate,
    primarySamples,
    setPrimarySamples,
    interimSamples,
    setInterimSamples,
    interimSamplesDate,
    setInterimSamplesDate,
    rwBaseline,
    setRwBaseline,
    rw,
    setRw,
    recommendations,
    setRecommendations,
    todayDate,
    draftData,
    applyDraft,
    patchPersonal: (patch: Partial<InterimPersonalData>) =>
      setPersonal((prev) => ({ ...prev, ...patch })),
    patchRecommendations: (patch: Partial<InterimRecommendationsData>) =>
      setRecommendations((prev) => ({ ...prev, ...patch })),
    patchRw: (patch: Partial<ReadingWritingState>) => setRw((prev) => ({ ...prev, ...patch })),
  };
}
