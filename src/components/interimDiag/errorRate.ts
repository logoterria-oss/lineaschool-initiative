import { ProcessDynamic } from './impairedProcesses';

/**
 * Пересчёт ошибок на 100 слов.
 *
 * Абсолютное число ошибок нельзя сравнивать между работами разной длины:
 * 20 ошибок в диктанте на 50 слов и 20 ошибок на 100 слов — это
 * двукратная разница в плотности. Приводим оба замера к общей базе.
 */

export function toNum(v: string | undefined): number | null {
  const s = (v ?? '').toString().replace(',', '.').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Ошибок на 100 слов. null — если не хватает данных или объём нулевой. */
export function per100(errors: string | undefined, words: string | undefined): number | null {
  const e = toNum(errors);
  const w = toNum(words);
  if (e === null || w === null || w <= 0) return null;
  return (e / w) * 100;
}

/** Округление для показа: до одного знака, но целые — без «.0» */
export function fmtRate(rate: number): string {
  const r = Math.round(rate * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',');
}

/**
 * Значение показателя для цепочки динамики.
 * Есть объём работы — «12 на 100 слов», нет — просто абсолютное число.
 */
export function rateLabel(errors: string | undefined, words: string | undefined): string {
  const rate = per100(errors, words);
  if (rate === null) return (errors ?? '').trim();
  return `${fmtRate(rate)} на 100 слов`;
}

/**
 * Насколько изменилась плотность ошибок между двумя замерами.
 * Возвращает готовую фразу или '' — если объём работы указан не везде.
 */
export function rateChangeText(
  fromErrors: string | undefined,
  fromWords: string | undefined,
  toErrors: string | undefined,
  toWords: string | undefined,
): string {
  const a = per100(fromErrors, fromWords);
  const b = per100(toErrors, toWords);
  if (a === null || b === null) return '';
  if (a === 0 && b === 0) return 'ошибок нет';
  if (a === 0) return 'ошибки появились';
  if (a === b) return 'без изменений';
  const percent = Math.round(Math.abs((b - a) / a) * 100);
  if (percent === 0) return 'без изменений';
  return b < a ? `снизилось на ${percent}%` : `выросло на ${percent}%`;
}

/** Динамика по плотности ошибок: меньше — лучше */
export function rateDynamic(
  fromErrors: string | undefined,
  fromWords: string | undefined,
  toErrors: string | undefined,
  toWords: string | undefined,
): ProcessDynamic {
  const a = per100(fromErrors, fromWords);
  const b = per100(toErrors, toWords);
  if (a === null || b === null || a === b) return 'same';
  return b < a ? 'up' : 'down';
}
