import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import {
  IMPAIRED_GROUPS,
  ImpairedProcessKey,
  ImpairedProcessesState,
  ProcessLevel,
  ProcessLevelsState,
  PROCESS_LEVELS,
  getDynamic,
} from './impairedProcesses';

interface Props {
  value: ImpairedProcessesState;
  baseline: ProcessLevelsState;
  levels: ProcessLevelsState;
  onChange: (key: ImpairedProcessKey, checked: boolean) => void;
  onLevelChange: (key: ImpairedProcessKey, level: ProcessLevel) => void;
  autoFilled: boolean;
}

const DYNAMIC_UI = {
  up: { icon: 'ArrowUp', className: 'text-green-600' },
  same: null,
  down: { icon: 'ArrowDown', className: 'text-red-600' },
} as const;

function DynamicSchema({ from, to }: { from: ProcessLevel; to: ProcessLevel }) {
  const dyn = getDynamic(from, to);
  const ui = DYNAMIC_UI[dyn];
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-700">
      <span className="text-gray-500">{from}</span>
      <Icon name="ArrowRight" size={16} className="text-gray-400" />
      <span className="font-medium text-gray-900">{to}</span>
      {ui && <Icon name={ui.icon} size={18} className={ui.className} />}
    </div>
  );
}

export default function InterimImpairedProcessesSection({
  value,
  baseline,
  levels,
  onChange,
  onLevelChange,
  autoFilled,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Нарушенные процессы</h2>
      <p className="text-sm text-gray-500 mb-6">
        {autoFilled
          ? 'Галочки проставлены автоматически по первичной диагностике. Их можно изменить вручную.'
          : 'Выберите ученика в разделе выше — галочки заполнятся из первичной диагностики.'}
      </p>

      <div className="space-y-8">
        {IMPAIRED_GROUPS.map((group, idx) => (
          <div key={group.title}>
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              {idx + 1}) {group.title}
            </h3>
            <div className="space-y-4">
              {group.items.map((item) => {
                const checked = value[item.key];
                const from = baseline[item.key];
                const to = levels[item.key];
                return (
                  <div key={item.key}>
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id={`impaired-${item.key}`}
                        checked={checked}
                        onCheckedChange={(c) => onChange(item.key, !!c)}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`impaired-${item.key}`}
                        className="text-sm leading-5 cursor-pointer"
                      >
                        {item.label}
                      </Label>
                    </div>

                    {checked && (
                      <div className="mt-2 ml-6">
                        <Select
                          value={to || undefined}
                          onValueChange={(v) => onLevelChange(item.key, v as ProcessLevel)}
                        >
                          <SelectTrigger className="w-full max-w-md">
                            <SelectValue placeholder="Выберите текущий уровень" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROCESS_LEVELS.map((lvl) => (
                              <SelectItem key={lvl} value={lvl}>
                                {lvl === 'норма' ? 'норма!' : lvl}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {from && to && <DynamicSchema from={from} to={to} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}