import Icon from '@/components/ui/icon';
import { ProcessDynamic } from './impairedProcesses';

export interface ChainStep {
  date: string | null; // дата замера
  value: string; // отображаемое значение
}

interface Props {
  steps: ChainStep[];
  // Динамика последнего перехода (предыдущий → последний): 'up' | 'same' | 'down'
  finalDynamic: ProcessDynamic;
}

function fmtDate(d: string | null): string {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
  return d;
}

function DynamicArrow({ dyn }: { dyn: ProcessDynamic }) {
  if (dyn === 'up') return <Icon name="ArrowUp" size={16} strokeWidth={2.75} className="text-dynamic-up" />;
  if (dyn === 'down') return <Icon name="ArrowDown" size={16} className="text-dynamic-down" />;
  return null;
}

// Подпись шага: первичная → 1-я, 2-я … промежуточная → сейчас
function stepLabel(idx: number, total: number): string {
  if (idx === 0) return 'Первичная';
  if (idx === total - 1) return 'Сейчас';
  return `${idx}-я промежут.`;
}

export default function DynamicChain({ steps, finalDynamic }: Props) {
  const visible = steps.filter((s) => (s.value || '').trim() !== '');
  if (visible.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-1 text-sm">
      {visible.map((step, idx) => {
        const isLast = idx === visible.length - 1;
        return (
          <div key={idx} className="flex items-end gap-2">
            <div className="flex flex-col">
              <span className="text-[11px] leading-none text-gray-400 mb-0.5">
                {stepLabel(idx, visible.length)}
                {step.date ? ` · ${fmtDate(step.date)}` : ''}
              </span>
              <span className={isLast ? 'font-medium text-gray-900' : 'text-gray-500'}>
                {step.value}
              </span>
            </div>
            {!isLast && <Icon name="ArrowRight" size={16} className="text-gray-400 mb-0.5" />}
            {isLast && <span className="mb-0.5"><DynamicArrow dyn={finalDynamic} /></span>}
          </div>
        );
      })}
    </div>
  );
}