import { InterimPrimaryData } from './InterimPersonalDataSection';

// Ключи всех чек-боксов раздела «Нарушенные процессы»
export type ImpairedProcessKey =
  // 1) Импрессивная речь
  | 'wordUnderstanding'
  | 'complexConstructions'
  | 'phonematicPerception'
  // 2) Экспрессивная речь
  | 'soundProduction'
  | 'syllableStructure'
  | 'kineticPraxis'
  | 'grammaticalStructure'
  | 'connectedSpeech'
  // 3) Языковой анализ и синтез
  | 'phonematicAnalysis'
  | 'syllableAnalysis'
  | 'sentenceAnalysis';

export type ImpairedProcessesState = Record<ImpairedProcessKey, boolean>;

export interface ImpairedGroup {
  title: string;
  items: { key: ImpairedProcessKey; label: string }[];
}

export const IMPAIRED_GROUPS: ImpairedGroup[] = [
  {
    title: 'Импрессивная речь',
    items: [
      { key: 'wordUnderstanding', label: 'понимание слов' },
      { key: 'complexConstructions', label: 'понимание лексико-грамматических конструкций' },
      { key: 'phonematicPerception', label: 'фонематическое восприятие' },
    ],
  },
  {
    title: 'Экспрессивная речь',
    items: [
      {
        key: 'soundProduction',
        label: 'звукопроизношение (только при акустико-артикуляционной дисграфии)',
      },
      { key: 'syllableStructure', label: 'слоговая структура слова' },
      { key: 'kineticPraxis', label: 'кинетический артикуляционный праксис' },
      { key: 'grammaticalStructure', label: 'грамматический строй речи' },
      { key: 'connectedSpeech', label: 'связная речь' },
    ],
  },
  {
    title: 'Языковой анализ и синтез',
    items: [
      { key: 'phonematicAnalysis', label: 'фонематический анализ и синтез' },
      { key: 'syllableAnalysis', label: 'слоговой анализ' },
      { key: 'sentenceAnalysis', label: 'языковой анализ на уровне предложений' },
    ],
  },
];

export const EMPTY_IMPAIRED_STATE: ImpairedProcessesState = {
  wordUnderstanding: false,
  complexConstructions: false,
  phonematicPerception: false,
  soundProduction: false,
  syllableStructure: false,
  kineticPraxis: false,
  grammaticalStructure: false,
  connectedSpeech: false,
  phonematicAnalysis: false,
  syllableAnalysis: false,
  sentenceAnalysis: false,
};

const norm = (v: string) => (v || '').trim().toLowerCase();

// Одиночное поле нарушено, если оно заполнено и это НЕ «норма»
const isSingleImpaired = (v: string) => {
  const s = norm(v);
  return s !== '' && s !== 'норма';
};

// Массив содержит строку, включающую подстроку (без учёта регистра)
const arrHas = (arr: string[], substr: string) =>
  (arr || []).some((x) => norm(x).includes(substr));

/**
 * Вычисляет автоматические галочки раздела «Нарушенные процессы»
 * на основе данных первичной диагностики.
 */
export function computeImpairedFromPrimary(
  p: InterimPrimaryData | undefined,
): ImpairedProcessesState {
  const state: ImpairedProcessesState = { ...EMPTY_IMPAIRED_STATE };
  if (!p) return state;

  // 1) Импрессивная речь
  state.wordUnderstanding = isSingleImpaired(p.wordUnderstanding);
  state.complexConstructions = isSingleImpaired(p.complexConstructions);
  state.phonematicPerception = isSingleImpaired(p.phonematicPerception);

  // 2) Экспрессивная речь
  const motor = p.motorRealization || [];

  // Звукопроизношение: нарушено в первичной И в заключении «артикуляторно-акустическая дисграфия»
  const soundImpairedInPrimary = arrHas(motor, 'нарушен');
  const hasArtAcousticDysgraphia = arrHas(p.dysgraphiaTypes || [], 'артикуляторно-акустическая');
  state.soundProduction = soundImpairedInPrimary && hasArtAcousticDysgraphia;

  state.syllableStructure = arrHas(motor, 'слоговая структура слова нарушена');
  state.kineticPraxis = arrHas(motor, 'кинетический артикуляционный праксис нарушен');
  state.grammaticalStructure = isSingleImpaired(p.grammaticalStructure);

  const connected = p.connectedSpeech || [];
  state.connectedSpeech = arrHas(connected, 'нарушен');

  // 3) Языковой анализ и синтез — нарушено, если «не соответствует» или «не сформирован»
  const la = p.languageAnalysis || [];
  const laImpaired = (kw: string) =>
    (la || []).some((x) => {
      const s = norm(x);
      return s.includes(kw) && (s.includes('не соответствует') || s.includes('не сформирован'));
    });
  state.phonematicAnalysis = laImpaired('фонематическ');
  state.syllableAnalysis = laImpaired('слогов');
  state.sentenceAnalysis = laImpaired('уровне предложения');

  return state;
}
