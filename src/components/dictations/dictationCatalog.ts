/** Диктанты для диагностик: класс, название и количество слов */
export interface DictationOption {
  grade: number;
  title: string;
  words: number;
}

/** Номер диагностики: 1 — первичная, далее промежуточные */
export type DiagNumber = 1 | 2 | 3 | 4;

export interface DictationSet {
  num: DiagNumber;
  label: string;
  items: DictationOption[];
}

export const DICTATION_SETS: DictationSet[] = [
  {
    num: 1,
    label: 'Первичная диагностика',
    items: [
      { grade: 1, title: 'Кот', words: 20 },
      { grade: 2, title: 'Птицы', words: 34 },
      { grade: 3, title: 'Ночью в лесу', words: 47 },
      { grade: 4, title: 'Летняя прогулка', words: 81 },
      { grade: 5, title: 'Лунная ночь', words: 80 },
    ],
  },
  {
    num: 2,
    label: 'Вторая диагностика',
    items: [
      { grade: 1, title: 'Осень', words: 20 },
      { grade: 2, title: 'Огород', words: 35 },
      { grade: 3, title: 'Котёнок', words: 48 },
      { grade: 4, title: 'Весна в лесу', words: 81 },
      { grade: 5, title: 'Волшебный мир звёзд', words: 95 },
    ],
  },
  {
    num: 3,
    label: 'Третья диагностика',
    items: [
      { grade: 1, title: 'День весны', words: 21 },
      { grade: 2, title: 'Конец октября', words: 37 },
      { grade: 3, title: 'Утро', words: 51 },
      { grade: 4, title: 'В пути', words: 78 },
      { grade: 5, title: 'Октябрь', words: 92 },
    ],
  },
  {
    num: 4,
    label: 'Четвёртая диагностика',
    items: [
      { grade: 1, title: 'На реке', words: 23 },
      { grade: 2, title: 'Белки', words: 35 },
      { grade: 3, title: 'Подарок', words: 46 },
      { grade: 4, title: 'Секрет мастера', words: 82 },
      { grade: 5, title: 'Поход за грибами', words: 95 },
    ],
  },
];

/** Наборы для промежуточной диагностики (вторая, третья, четвёртая) */
export const INTERIM_SETS = DICTATION_SETS.filter((s) => s.num !== 1);

/** Набор первичной диагностики */
export const PRIMARY_SET = DICTATION_SETS.find((s) => s.num === 1)!;

/** Значение выпадающего списка: «2-3» = набор 2, 3 класс */
export const optionValue = (num: DiagNumber, grade: number) => `${num}-${grade}`;

export function findDictation(value: string): (DictationOption & { num: DiagNumber }) | null {
  const [numStr, gradeStr] = value.split('-');
  const set = DICTATION_SETS.find((s) => String(s.num) === numStr);
  const item = set?.items.find((i) => String(i.grade) === gradeStr);
  return set && item ? { ...item, num: set.num } : null;
}

/** Подобрать диктант по числу слов — чтобы показать выбранный в списке */
export function matchByWords(words: string, sets: DictationSet[]): string {
  const n = Number(words);
  if (!words || Number.isNaN(n)) return '';
  for (const s of sets) {
    const hit = s.items.find((i) => i.words === n);
    if (hit) return optionValue(s.num, hit.grade);
  }
  return '';
}
