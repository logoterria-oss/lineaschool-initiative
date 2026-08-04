import { InterimPrimaryData } from './InterimPersonalDataSection';
import { ProcessDynamic } from './impairedProcesses';

// Ключи показателей, у которых есть сравнение «было → стало»
export type RWMetric =
  | 'readingSpeed'
  | 'readingComprehension'
  | 'dysgraphicErrors'
  | 'dysorthographicErrors'
  | 'totalErrors';

// Один тип дисграфической ошибки в списке промежуточной диагностики
export interface DysgraphicErrorItem {
  label: string;
  struck: boolean; // вычеркнут (таких ошибок больше нет)
  added: boolean; // добавлен вручную на промежуточной (показываем красным с «+»)
}

// Состояние раздела «Чтение и письмо», которое заполняет логопед на промежуточной
export interface ReadingWritingState {
  readingSpeed: string; // сл/мин
  readingComprehension: string; // %
  readingErrorTypes: string; // тип ошибок (рукописный ввод)
  writingSamples: string[]; // изображения (base64/URL)
  dysgraphicErrors: string; // количество
  dysorthographicErrors: string; // количество
  totalErrors: string; // всего ошибок
  errorTypes: DysgraphicErrorItem[]; // список типов дисграфических ошибок
  // Ручной ввод «было», когда в первичной данных нет
  baselineOverride: Partial<Record<RWMetric, string>>;
}

// Значения «было» из первичной диагностики
export interface ReadingWritingBaseline {
  readingSpeed: string;
  readingComprehension: string;
  dysgraphicErrors: string;
  dysorthographicErrors: string;
  totalErrors: string;
}

export const EMPTY_RW_STATE: ReadingWritingState = {
  readingSpeed: '',
  readingComprehension: '',
  readingErrorTypes: '',
  writingSamples: [],
  dysgraphicErrors: '',
  dysorthographicErrors: '',
  totalErrors: '',
  errorTypes: [],
  baselineOverride: {},
};

// Полный каталог типов дисграфических ошибок (для добавления новых на промежуточной)
export const DYSGRAPHIC_ERROR_CATALOG: { group: string; items: string[] }[] = [
  {
    group: 'Ошибки языкового анализа и синтеза',
    items: ['пропуски', 'вставки', 'перестановки', 'антиципации (предвосхищение)'],
  },
  {
    group: 'Ошибки акустико-артикуляторного сходства',
    items: [
      'замены и смешения звонких-глухих согласных',
      'ошибки обозначения мягкости',
      'замены и смешения свистящих-шипящих согласных',
      'замены и смешения аффрикатов и их компонентов',
      'замены и смешения заднеязычных согласных',
      'замены и смешения соноров',
      'замены и смешения гласных в сильной позиции',
      'замены и смешения согласных по способу образования',
      'замены и смешения согласных по месту образования',
    ],
  },
  {
    group: 'Моторные ошибки',
    items: [
      'ошибки кинетического запуска',
      'графический поиск при написании буквы',
      'лишние элементы при написании буквы',
      'недописывание отдельных элементов буквы',
      'персеверации (повтор целой буквы, узнаваемой её части или слога)',
      'неоднократные правильные обводки букв',
    ],
  },
  {
    group: 'Зрительно-моторные ошибки',
    items: [
      'смешение оптически сходных букв',
      'неточность передачи графического образа буквы',
      'неадекватность начертания буквы',
    ],
  },
  {
    group: 'Зрительно-пространственные ошибки',
    items: [
      'зеркальность написания букв',
      'неудержание строки',
      'дисметрия букв',
      'дисметрия элементов букв',
      'колебание наклона букв',
      'отсутствие слитности написания букв в словах',
      'левостороннее игнорирование',
      'неравномерность расстояний между словами',
      'избегания переноса слов',
    ],
  },
  {
    group: 'Нарушения регуляции письменной деятельности',
    items: [
      'пропуски элементов букв, букв, слогов, слов',
      'персеверации (навязчивые повторения) элементов букв, букв, слогов, слов',
      'контоминации (объединение слов)',
      'антиципации (предвосхищение слов и их элементов)',
      'ошибки обозначения границ предложения',
      'орфографические ошибки',
    ],
  },
];

// Собирает отмеченные при первичной типы дисграфических ошибок (кроме «нет»)
export function collectPrimaryErrorTypes(p: InterimPrimaryData | undefined): DysgraphicErrorItem[] {
  if (!p) return [];
  const groups = [
    p.analysisErrors,
    p.acousticErrors,
    p.motorErrors,
    p.visualMotorErrors,
    p.visualSpatialErrors,
    p.regulationViolations,
  ];
  const seen = new Set<string>();
  const out: DysgraphicErrorItem[] = [];
  groups.forEach((arr) => {
    (arr || []).forEach((raw) => {
      const label = (raw || '').trim();
      const low = label.toLowerCase();
      if (!label || low === 'нет') return;
      if (seen.has(low)) return;
      seen.add(low);
      out.push({ label, struck: false, added: false });
    });
  });
  return out;
}

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
    totalErrors: p?.totalErrors || '',
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