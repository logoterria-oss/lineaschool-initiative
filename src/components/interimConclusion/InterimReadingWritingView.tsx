import { RWMetric } from '@/components/interimDiag/readingWriting';
import ConclusionChain from './ConclusionChain';
import {
  InterimHistoryItem,
  metricChain,
  metricDynamic,
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
  { key: 'dysgraphicErrors', label: 'Дисграфических ошибок', moreIsBetter: false },
  { key: 'dysorthographicErrors', label: 'Орфографических ошибок', moreIsBetter: false },
  { key: 'totalErrors', label: 'Ошибок всего', moreIsBetter: false },
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

  const rows = METRICS.map((m) => ({
    ...m,
    steps: metricChain(
      m.key,
      baseline?.[m.key] || '',
      history,
      rw?.[m.key] || '',
      primaryDate,
      todayDate,
    ),
  })).filter((r) => r.steps.length > 0);

  if (charSteps.length === 0 && rows.length === 0) return null;

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
        {rows.map((r) => (
          <div key={r.key} className="chain-row border-l-2 border-gray-200 pl-3">
            <p className="mb-1 text-sm text-gray-700">
              {r.label}
              {r.unit ? `, ${r.unit}` : ''}
            </p>
            <ConclusionChain steps={r.steps} dynamic={metricDynamic(r.steps, r.moreIsBetter)} />
          </div>
        ))}
      </div>
    </section>
  );
}