import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IMPAIRED_GROUPS,
  ImpairedProcessKey,
  ImpairedProcessesState,
  ProcessLevel,
  ProcessLevelsState,
  PROCESS_LEVELS,
  getDynamic,
} from './impairedProcesses';
import DynamicChain, { ChainStep } from './DynamicChain';
import { InterimHistoryEntry } from './InterimPersonalDataSection';

interface Props {
  value: ImpairedProcessesState;
  baseline: ProcessLevelsState;
  levels: ProcessLevelsState;
  history: InterimHistoryEntry[];
  primaryDate: string | null;
  todayDate: string;
  onChange: (key: ImpairedProcessKey, checked: boolean) => void;
  onLevelChange: (key: ImpairedProcessKey, level: ProcessLevel) => void;
  autoFilled: boolean;
}

export default function InterimImpairedProcessesSection({
  value,
  baseline,
  levels,
  history,
  primaryDate,
  todayDate,
  onChange,
  onLevelChange,
  autoFilled,
}: Props) {
  // Строит цепочку «было → … → сейчас» для одного процесса
  const buildSteps = (key: ImpairedProcessKey): ChainStep[] => {
    const steps: ChainStep[] = [];
    const base = baseline[key];
    if (base) steps.push({ date: primaryDate, value: base });
    (history || []).forEach((h) => {
      const v = h.levels?.[key];
      if (v) steps.push({ date: h.date, value: v });
    });
    const cur = levels[key];
    if (cur) steps.push({ date: todayDate, value: cur });
    return steps;
  };
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
                const steps = buildSteps(item.key);
                const finalDynamic =
                  steps.length >= 2
                    ? getDynamic(
                        steps[steps.length - 2].value as ProcessLevel,
                        steps[steps.length - 1].value as ProcessLevel,
                      )
                    : 'same';
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
                          value={levels[item.key] || undefined}
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

                        <DynamicChain steps={steps} finalDynamic={finalDynamic} />
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