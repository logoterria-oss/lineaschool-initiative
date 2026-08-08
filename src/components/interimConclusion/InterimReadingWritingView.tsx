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
  rw: Record<string, string>;
  history: InterimHistoryItem[];
  primaryDate: string | null;
  todayDate: string | null;
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
  const charSteps = readingCharChain(
    baseline?.readingChar || '',
    history,
    rw?.readingChar || '',
    primaryDate,
    todayDate,
  );

  const rows = METRICS.map((m) => {
    const steps = metricChain(
      m.key,
      baseline?.[m.key] || '',
      history,
      rw?.[m.key] || '',
      primaryDate,
      todayDate,
    );
    return { ...m, steps, summary: metricSummary(steps) };
  }).filter((r) => r.steps.length > 0);

  const errorRows = ERROR_METRICS.map((m) => {
    const steps = errorRateChain(m.key, baseline || {}, history, rw || {}, primaryDate, todayDate);
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
                      ? 'font-medium text-green-700'
                      : dyn === 'down'
                        ? 'text-red-600'
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
                      ? 'font-medium text-green-700'
                      : dyn === 'down'
                        ? 'text-red-600'
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