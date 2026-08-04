import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  IMPAIRED_GROUPS,
  ImpairedProcessKey,
  ImpairedProcessesState,
} from './impairedProcesses';

interface Props {
  value: ImpairedProcessesState;
  onChange: (key: ImpairedProcessKey, checked: boolean) => void;
  autoFilled: boolean;
}

export default function InterimImpairedProcessesSection({ value, onChange, autoFilled }: Props) {
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
            <div className="space-y-3">
              {group.items.map((item) => (
                <div key={item.key} className="flex items-start space-x-2">
                  <Checkbox
                    id={`impaired-${item.key}`}
                    checked={value[item.key]}
                    onCheckedChange={(checked) => onChange(item.key, !!checked)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={`impaired-${item.key}`}
                    className="text-sm leading-5 cursor-pointer"
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
