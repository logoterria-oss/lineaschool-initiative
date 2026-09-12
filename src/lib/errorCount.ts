/**
 * Количество ошибок, которое специалист не смог подсчитать.
 *
 * В работе бывает так много ошибок (или почерк настолько неразборчив),
 * что точное число назвать нельзя. Для сравнений такое значение считается
 * БОЛЬШЕ любого конкретного числа — то есть худшим результатом.
 */

/** Формы ошибок: специалист не смог определить характер ошибок. */
export const UNDETECTABLE = 'невозможно определить';

/** Форм ошибок нет. */
export const NO_ERRORS = 'нет';

/** Взаимоисключающие варианты: выбор любого из них снимает все остальные. */
export const EXCLUSIVE_OPTIONS = [NO_ERRORS, UNDETECTABLE];

export const UNCOUNTABLE = 'uncountable';

export const UNCOUNTABLE_LABEL = 'Невозможно подсчитать';

export const isUncountable = (v: string | undefined | null): boolean =>
  (v ?? '').toString().trim() === UNCOUNTABLE;

/** Значение для показа в отчёте: число как есть, спецзначение — словами. */
export const errorCountText = (v: string | undefined | null): string =>
  isUncountable(v) ? UNCOUNTABLE_LABEL : (v ?? '').toString();

/**
 * Число для расчётов. «Невозможно подсчитать» → +бесконечность,
 * чтобы любое сравнение показывало это значение как наибольшее.
 */
export const errorCountNum = (v: string | undefined | null): number | null => {
  if (isUncountable(v)) return Number.POSITIVE_INFINITY;
  const s = (v ?? '').toString().replace(',', '.').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};