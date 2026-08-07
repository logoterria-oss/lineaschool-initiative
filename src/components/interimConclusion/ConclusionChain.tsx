import Icon from '@/components/ui/icon';
import { ProcessDynamic } from '@/components/interimDiag/impairedProcesses';

export interface ConclusionStep {
  date: string | null;
  label: string;
  // Укороченная подпись — показывается только при печати
  labelShort?: string;
  value: string;
}

interface Props {
  steps: ConclusionStep[];
  dynamic: ProcessDynamic;
}

export function fmtDate(d: string | null): string {
  if (!d) return '';
  const p = d.split('-');
  return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : d;
}

export default function ConclusionChain({ steps, dynamic }: Props) {
  const visible = steps.filter((s) => (s.value || '').trim() !== '');
  if (visible.length === 0) return null;

  return (
    <div
      className="chain-line flex flex-wrap items-end gap-x-2 gap-y-1 text-sm"
      data-steps={visible.length}
    >
      {visible.map((step, idx) => {
        const isLast = idx === visible.length - 1;
        return (
          <div key={idx} className="chain-step flex items-end gap-2">
            <div className="flex flex-col">
              <span className="chain-label text-[11px] leading-none text-gray-500 mb-0.5">
                <span className="print:hidden">{step.label}</span>
                <span className="hidden print:inline">{step.labelShort || step.label}</span>
                {step.date ? ` · ${fmtDate(step.date)}` : ''}
              </span>
              <span
                className={`chain-value ${isLast ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
              >
                {step.value}
              </span>
            </div>
            {!isLast && <Icon name="ArrowRight" size={15} className="mb-0.5 text-gray-400" />}
            {isLast && dynamic === 'up' && (
              <Icon name="ArrowUp" size={15} className="mb-0.5 text-green-600" />
            )}
            {isLast && dynamic === 'down' && (
              <Icon name="ArrowDown" size={15} className="mb-0.5 text-red-600" />
            )}
          </div>
        );
      })}
    </div>
  );
}