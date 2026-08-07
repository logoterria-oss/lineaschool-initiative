import Icon from '@/components/ui/icon';
import { ProcessDynamic } from '@/components/interimDiag/impairedProcesses';

export interface ConclusionStep {
  date: string | null;
  label: string;
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
    /* Цепочка всегда в одну строку. Шаги идут вплотную друг к другу
       по ширине содержимого: числа «22 → 31 → 34» не должны
       расползаться на всю строку. */
    <div
      className="chain-line flex flex-nowrap items-start gap-x-3 text-sm"
      data-steps={visible.length}
    >
      {visible.map((step, idx) => {
        const isLast = idx === visible.length - 1;
        return (
          <div key={idx} className="chain-step flex min-w-0 shrink items-start gap-1.5">
            {/* max-w — предел, после которого длинная формулировка
                переносится по словам, а не тянет строку вправо */}
            <div className="flex min-w-0 max-w-[13rem] flex-col">
              <span className="chain-label mb-0.5 text-[11px] leading-tight text-gray-500">
                {step.label}
                {step.date ? ` · ${fmtDate(step.date)}` : ''}
              </span>
              <span
                className={`chain-value leading-snug ${isLast ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
              >
                {step.value}
              </span>
            </div>
            {/* mt-[18px] — сдвиг на высоту подписи, чтобы стрелка
                встала на одну линию с первой строкой значения */}
            {!isLast && (
              <Icon
                name="ArrowRight"
                size={15}
                className="mt-[18px] shrink-0 text-gray-400"
                fallback="MoveRight"
              />
            )}
            {isLast && dynamic === 'up' && (
              <Icon name="ArrowUp" size={15} className="mt-[18px] shrink-0 text-green-600" />
            )}
            {isLast && dynamic === 'down' && (
              <Icon name="ArrowDown" size={15} className="mt-[18px] shrink-0 text-red-600" />
            )}
          </div>
        );
      })}
    </div>
  );
}