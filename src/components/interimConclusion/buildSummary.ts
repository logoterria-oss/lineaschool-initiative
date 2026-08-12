import {
  IMPAIRED_GROUPS,
  ImpairedProcessKey,
  ImpairedProcessesState,
  PROCESS_LEVELS,
  ProcessLevel,
  ProcessLevelsState,
} from '@/components/interimDiag/impairedProcesses';
import { per100 } from '@/components/interimDiag/errorRate';

/**
 * Автоматический общий вывод о динамике.
 * Собирается из тех же данных, что и цепочки выше по заключению:
 * уровни речевых процессов, скорость и понимание чтения, плотность ошибок.
 * Логопед видит текст в форме и может переписать его вручную.
 */

interface Args {
  impaired: ImpairedProcessesState;
  baseline: ProcessLevelsState;
  levels: ProcessLevelsState;
  // Показатели чтения и письма: берём только строковые поля, списки игнорируем
  rwBaseline: Record<string, unknown>;
  rw: Record<string, unknown>;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function labelOf(key: string): string {
  for (const g of IMPAIRED_GROUPS) {
    const item = g.items.find((i) => i.key === key);
    if (item) return item.label;
  }
  return key;
}

function levelIndex(l?: ProcessLevel): number {
  return l ? PROCESS_LEVELS.indexOf(l) : -1;
}

/** Перечисление через запятую с «и» перед последним */
function enumerate(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} и ${items[items.length - 1]}`;
}

function num(v?: string): number | null {
  const s = (v ?? '').replace(',', '.').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function percentChange(from: number, to: number): number {
  if (from === 0) return 0;
  return Math.round(Math.abs((to - from) / from) * 100);
}

export function buildInterimSummary({
  impaired,
  baseline,
  levels,
  rwBaseline,
  rw,
}: Args): string {
  const improved: string[] = [];
  const unchanged: string[] = [];
  const worsened: string[] = [];
  const reachedNorm: string[] = [];

  /* «Было» = данные первичной + дозаполненное логопедом вручную.
     В первичных до августа 2026 не было поля «количество слов в работе»,
     логопед вносит его на промежуточной — иначе ошибки не привести
     к «на 100 слов». */
  const override = (rw?.baselineOverride || {}) as Record<string, string>;
  const rwBase: Record<string, unknown> = { ...(rwBaseline || {}) };
  Object.entries(override).forEach(([key, value]) => {
    const manual = (value || '').trim();
    if (manual !== '' && (str(rwBase[key]) || '').trim() === '') rwBase[key] = manual;
  });

  // 1. Речевые процессы: сравниваем уровень «было» и «стало»
  (Object.keys(impaired || {}) as ImpairedProcessKey[])
    .filter((k) => impaired[k])
    .forEach((k) => {
      const from = levelIndex(baseline?.[k]);
      const to = levelIndex(levels?.[k]);
      if (from < 0 || to < 0) return;

      const label = labelOf(k);
      if (to > from) {
        improved.push(label);
        if (levels?.[k] === 'норма') reachedNorm.push(label);
      } else if (to < from) {
        worsened.push(label);
      } else {
        unchanged.push(label);
      }
    });

  // 2. Чтение: скорость и понимание — рост здесь означает улучшение
  const readingImproved: string[] = [];
  const readingUnchanged: string[] = [];
  const readingWorsened: string[] = [];

  const readingMetrics: { key: string; label: string }[] = [
    { key: 'readingSpeed', label: 'скорость чтения' },
    { key: 'readingComprehension', label: 'понимание прочитанного' },
  ];

  readingMetrics.forEach(({ key, label }) => {
    const a = num(str(rwBase?.[key]));
    const b = num(str(rw?.[key]));
    if (a === null || b === null) return;

    if (b > a) {
      const p = percentChange(a, b);
      readingImproved.push(p > 0 ? `${label} (+${p}%)` : label);
    } else if (b < a) {
      readingWorsened.push(label);
    } else {
      readingUnchanged.push(label);
    }
  });

  // 3. Ошибки письма: сравниваем плотность на 100 слов
  const errorMetrics: { key: string; label: string }[] = [
    { key: 'dysgraphicErrors', label: 'дисграфических ошибок' },
    { key: 'dysorthographicErrors', label: 'орфографических ошибок' },
  ];

  const errorsDown: string[] = [];
  const errorsUp: string[] = [];
  const errorsSame: string[] = [];

  errorMetrics.forEach(({ key, label }) => {
    const a = per100(str(rwBase?.[key]), str(rwBase?.dictationWords));
    const b = per100(str(rw?.[key]), str(rw?.dictationWords));
    if (a === null || b === null) return;

    if (b < a) {
      errorsDown.push(`${label} — на ${percentChange(a, b)}% меньше`);
    } else if (b > a) {
      errorsUp.push(`${label} — на ${percentChange(a, b)}% больше`);
    } else {
      errorsSame.push(label);
    }
  });

  // Собираем текст
  const parts: string[] = [];

  const positives: string[] = [];
  if (improved.length > 0) positives.push(enumerate(improved));
  if (readingImproved.length > 0) positives.push(enumerate(readingImproved));
  if (errorsDown.length > 0) positives.push(enumerate(errorsDown));

  if (positives.length > 0) {
    let text = `Положительная динамика: ${positives.join('; ')}.`;
    if (reachedNorm.length > 0) {
      text += ` Достигнут уровень возрастной нормы: ${enumerate(reachedNorm)}.`;
    }
    parts.push(text);
  }

  const stable = [...unchanged, ...readingUnchanged, ...errorsSame];
  if (stable.length > 0) {
    parts.push(`Без значимых изменений: ${enumerate(stable)}.`);
  }

  const attention = [...worsened, ...readingWorsened, ...errorsUp];
  if (attention.length > 0) {
    parts.push(
      `Требует внимания педагогов: ${enumerate(attention)}. ` +
        'Рекомендуется усилить работу по этим направлениям и учитывать их при подаче учебного материала.',
    );
  } else if (stable.length > 0) {
    parts.push(
      'Педагогам рекомендуется продолжить работу по направлениям, ' +
        'которые пока не показали изменений.',
    );
  }

  if (parts.length === 0) {
    return '';
  }

  return parts.join('\n\n');
}