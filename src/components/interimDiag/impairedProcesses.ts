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

// 4 уровня развития процесса, по возрастанию (индекс = «сила» уровня)
export type ProcessLevel =
  | 'грубо нарушено'
  | 'не соответствует возрастной норме'
  | 'приближено к возрастной норме'
  | 'норма';

export const PROCESS_LEVELS: ProcessLevel[] = [
  'грубо нарушено',
  'не соответствует возрастной норме',
  'приближено к возрастной норме',
  'норма',
];

// Выбранный на промежуточной диагностике уровень («стало») по каждому процессу
export type ProcessLevelsState = Partial<Record<ImpairedProcessKey, ProcessLevel>>;

// Динамика: улучшение / без изменений / ухудшение
export type ProcessDynamic = 'up' | 'same' | 'down';

export function getDynamic(from: ProcessLevel, to: ProcessLevel): ProcessDynamic {
  const a = PROCESS_LEVELS.indexOf(from);
  const b = PROCESS_LEVELS.indexOf(to);
  if (b > a) return 'up';
  if (b < a) return 'down';
  return 'same';
}

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

// Сопоставляет произвольную формулировку из первичной с одним из 4 уровней.
// Если точной фразы нет, но процесс отмечен как нарушенный —
// возвращаем «не соответствует возрастной норме».
function matchLevel(text: string): ProcessLevel {
  const s = norm(text);
  if (s.includes('грубо')) return 'грубо нарушено';
  if (s.includes('приближ')) return 'приближено к возрастной норме';
  if (s.includes('не соответствует') || s.includes('не сформиров') || s.includes('нарушен')) {
    return 'не соответствует возрастной норме';
  }
  if (s === 'норма' || (s.includes('норма') && !s.includes('не '))) {
    return 'норма';
  }
  // Отмечено как нарушенное, но точной фразы нет — берём средний «нарушенный» уровень
  return 'не соответствует возрастной норме';
}

// Возвращает исходный уровень («было») из первичной для одного массива-источника,
// найдя элемент, содержащий ключевое слово.
function levelFromArray(arr: string[], kw: string): ProcessLevel {
  const item = (arr || []).find((x) => norm(x).includes(kw));
  return matchLevel(item || '');
}

/**
 * Вычисляет исходный уровень («было») по каждому процессу из первичной диагностики.
 * Заполняется только для процессов, отмеченных как нарушенные.
 */
export function computeBaselineLevels(
  p: InterimPrimaryData | undefined,
  impaired: ImpairedProcessesState,
): ProcessLevelsState {
  const out: ProcessLevelsState = {};
  if (!p) return out;

  const motor = p.motorRealization || [];
  const connected = p.connectedSpeech || [];
  const la = p.languageAnalysis || [];

  if (impaired.wordUnderstanding) out.wordUnderstanding = matchLevel(p.wordUnderstanding);
  if (impaired.complexConstructions) out.complexConstructions = matchLevel(p.complexConstructions);
  if (impaired.phonematicPerception) out.phonematicPerception = matchLevel(p.phonematicPerception);

  if (impaired.soundProduction) out.soundProduction = levelFromArray(motor, 'нарушен');
  if (impaired.syllableStructure) out.syllableStructure = levelFromArray(motor, 'слоговая структура');
  if (impaired.kineticPraxis) out.kineticPraxis = levelFromArray(motor, 'кинетический');
  if (impaired.grammaticalStructure) out.grammaticalStructure = matchLevel(p.grammaticalStructure);
  if (impaired.connectedSpeech) out.connectedSpeech = levelFromArray(connected, 'нарушен');

  if (impaired.phonematicAnalysis) out.phonematicAnalysis = levelFromArray(la, 'фонематическ');
  if (impaired.syllableAnalysis) out.syllableAnalysis = levelFromArray(la, 'слогов');
  if (impaired.sentenceAnalysis) out.sentenceAnalysis = levelFromArray(la, 'уровне предложения');

  return out;
}