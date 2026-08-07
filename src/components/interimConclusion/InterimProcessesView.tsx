import { IMPAIRED_GROUPS } from '@/components/interimDiag/impairedProcesses';
import ConclusionChain from './ConclusionChain';
import { InterimHistoryItem, processChain, processDynamic } from './buildChains';

interface Props {
  impaired: Record<string, boolean>;
  baseline: Record<string, string>;
  levels: Record<string, string>;
  history: InterimHistoryItem[];
  primaryDate: string | null;
  todayDate: string | null;
}

export default function InterimProcessesView({
  impaired,
  baseline,
  levels,
  history,
  primaryDate,
  todayDate,
}: Props) {
  const groups = IMPAIRED_GROUPS.map((g) => ({
    title: g.title,
    items: g.items.filter((it) => impaired?.[it.key]),
  })).filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-gray-900">Динамика нарушенных процессов</h2>
      <div className="space-y-5">
        {groups.map((group, idx) => (
          <div key={group.title} className="chain-group">
            <h3 className="mb-2 text-base font-semibold text-gray-800">
              {idx + 1}) {group.title}
            </h3>
            <div className="space-y-3">
              {group.items.map((item) => {
                const steps = processChain(
                  item.key,
                  baseline,
                  history,
                  levels,
                  primaryDate,
                  todayDate,
                );
                if (steps.length === 0) return null;
                return (
                  <div key={item.key} className="chain-row border-l-2 border-gray-200 pl-3">
                    <p className="mb-1 text-sm text-gray-700">{item.label}</p>
                    <ConclusionChain steps={steps} dynamic={processDynamic(steps)} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}