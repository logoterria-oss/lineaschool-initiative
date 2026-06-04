// Утилиты для нечёткого сравнения ФИО — чтобы ловить опечатки и лишние слова
// при поиске дублей платежей.

// Нормализация имени: нижний регистр, ё→е, убираем лишние пробелы и знаки
export const normalizeName = (raw: string): string =>
  (raw || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Расстояние Левенштейна между двумя строками
const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const curr = [i + 1];
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      curr[j + 1] = Math.min(curr[j] + 1, prev[j + 1] + 1, prev[j] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
};

// Два слова считаем «похожими», если расстояние Левенштейна мало
// относительно длины (опечатки в 1-2 символа).
const wordsSimilar = (a: string, b: string): boolean => {
  if (a === b) return true;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen <= 3) return a === b; // короткие слова сравниваем строго
  const dist = levenshtein(a, b);
  const allowed = maxLen <= 5 ? 1 : 2;
  return dist <= allowed;
};

// Похожи ли два ФИО: устойчиво к опечаткам и лишним/недостающим словам.
// Логика: для более короткого набора слов каждое слово должно найти
// похожее слово в другом наборе.
export const namesSimilar = (rawA: string, rawB: string): boolean => {
  const a = normalizeName(rawA);
  const b = normalizeName(rawB);
  if (!a || !b) return false;
  if (a === b) return true;

  const wordsA = a.split(' ');
  const wordsB = b.split(' ');
  const [shortWords, longWords] =
    wordsA.length <= wordsB.length ? [wordsA, wordsB] : [wordsB, wordsA];

  let matched = 0;
  const usedLong = new Set<number>();
  for (const w of shortWords) {
    const idx = longWords.findIndex((lw, i) => !usedLong.has(i) && wordsSimilar(w, lw));
    if (idx !== -1) {
      usedLong.add(idx);
      matched++;
    }
  }
  // Достаточно, чтобы совпали все слова более короткого ФИО,
  // но не меньше двух (фамилия + имя), чтобы не склеить разных людей.
  return matched === shortWords.length && matched >= 2;
};
