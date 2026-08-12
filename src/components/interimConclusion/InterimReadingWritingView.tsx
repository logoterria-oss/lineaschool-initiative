import { RWMetric } from '@/components/interimDiag/readingWriting';
import ConclusionChain from './ConclusionChain';
import {
  ErrorMetric,
  InterimHistoryItem,
  errorRateChain,
  errorRateDynamic,
  errorRateSummary,
  metricChain,
  metricDynamic,
  metricSummary,
  readingCharChain,
  readingCharDynamic,
} from './buildChains';

interface Props {
  baseline: Record<string, string>;
  // rw может содержать не только строки (списки ошибок, baselineOverride)
  rw: Record<string, unknown>;
  history: InterimHistoryItem[];
  primaryDate: string | null;
  todayDate: string | null;
}

/**
 * Значения «было» с учётом ручного ввода логопеда.
 *
 * В первичных диагностиках до августа 2026 не было поля «количество слов
 * в работе», поэтому логопед вносит объём прошлой работы вручную на
 * промежуточной — он попадает в baselineOverride. Без этого объёма ошибки
 * невозможно привести к «на 100 слов», и заключение показывало штуки.
 */
function mergeBaseline(
  baseline: Record<string, string>,
  rw: Record<string, unknown>,
): Record<string, string> {
  const override = (rw?.baselineOverride || {}) as Record<string, string>;
  const merged: Record<string, string> = { ...(baseline || {}) };
  Object.entries(override).forEach(([key, value]) => {
    const manual = (value || '').trim();
    // Данные первичной приоритетнее ручного ввода
    if (manual !== '' && (merged[key] || '').trim() === '') merged[key] = manual;
  });
  return merged;
}

const METRICS: { key: RWMetric; label: string; unit?: string; moreIsBetter: boolean }[] = [
  { key: 'readingSpeed', label: 'Скорость чтения', unit: 'сл/мин', moreIsBetter: true },
  { key: 'readingComprehension', label: 'Понимание прочитанного', unit: '%', moreIsBetter: true },
];

// Ошибки показываем отдельно: их сравниваем в пересчёте на 100 слов
const ERROR_METRICS: { key: ErrorMetric; label: string }[] = [
  { key: 'dysgraphicErrors', label: 'Дисграфических ошибок' },
  { key: 'dysorthographicErrors', label: 'Орфографических ошибок' },
  { key: 'totalErrors', label: 'Ошибок всего' },
];

export default function InterimReadingWritingView({
  baseline,
  rw,
  history,
  primaryDate,
  todayDate,
}: Props) {
  // «Было» = данные первичной + то, что логопед дозаполнил вручную
  const base = mergeBaseline(baseline, rw);
  const cur = (rw || {}) as Record<string, string>;

  const charSteps = readingCharChain(
    base?.readingChar || '',
    history,
    cur?.readingChar || '',
    primaryDate,
    todayDate,
  );

  const rows = METRICS.map((m) => {
    const steps = metricChain(
      m.key,
      base?.[m.key] || '',
      history,
      cur?.[m.key] || '',
      primaryDate,
      todayDate,
    );
    return { ...m, steps, summary: metricSummary(steps) };
  }).filter((r) => r.steps.length > 0);

  const errorRows = ERROR_METRICS.map((m) => {
    const steps = errorRateChain(m.key, base, history, cur, primaryDate, todayDate);
    return { ...m, steps, summary: errorRateSummary(steps) };
  }).filter((r) => r.steps.length > 0);

  if (charSteps.length === 0 && rows.length === 0 && errorRows.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-gray-900">Динамика чтения и письма</h2>
      <div className="space-y-3">
        {charSteps.length > 0 && (
          <div className="chain-row border-l-2 border-gray-200 pl-3">
            <p className="mb-1 text-sm text-gray-700">Характер чтения</p>
            <ConclusionChain steps={charSteps} dynamic={readingCharDynamic(charSteps)} />
          </div>
        )}
        {rows.map((r) => {
          const dyn = metricDynamic(r.steps, r.moreIsBetter);
          return (
            <div key={r.key} className="chain-row border-l-2 border-gray-200 pl-3">
              <p className="mb-1 text-sm text-gray-700">
                {r.label}
                {r.unit ? `, ${r.unit}` : ''}
              </p>
              <ConclusionChain steps={r.steps} dynamic={dyn} />
              {/* Итог по всей цепочке: рост здесь — это улучшение */}
              {r.summary && (
                <p
                  className={`mt-0.5 text-xs ${
                    dyn === 'up'
                      ? 'font-semibold text-dynamic-up'
                      : dyn === 'down'
                        ? 'font-medium text-dynamic-down'
                        : 'text-gray-500'
                  }`}
                >
                  {r.summary}
                </p>
              )}
            </div>
          );
        })}
        {errorRows.map((r) => {
          const dyn = errorRateDynamic(r.steps);
          return (
            <div key={r.key} className="chain-row border-l-2 border-gray-200 pl-3">
              <p className="mb-1 text-sm text-gray-700">{r.label}</p>
              <ConclusionChain steps={r.steps} dynamic={dyn} />
              {/* Итог по всей цепочке: от первого замера к последнему */}
              {r.summary && (
                <p
                  className={`mt-0.5 text-xs ${
                    dyn === 'up'
                      ? 'font-semibold text-dynamic-up'
                      : dyn === 'down'
                        ? 'font-medium text-dynamic-down'
                        : 'text-gray-500'
                  }`}
                >
                  {r.summary}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}