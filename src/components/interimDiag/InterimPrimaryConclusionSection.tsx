import Icon from '@/components/ui/icon';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  conclusion: string;
  selected: boolean;
  hint?: string;
  onChange: (value: string) => void;
}

export default function InterimPrimaryConclusionSection({
  conclusion,
  selected,
  hint,
  onChange,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Заключение</h2>
      <p className="text-sm text-gray-500 mb-4">
        Подтягивается из первичной диагностики, если она есть. Текст можно изменить или написать
        полностью вручную.
      </p>

      {selected && hint && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <Icon name="TrendingUp" size={18} className="mt-0.5 flex-shrink-0 text-green-600" />
          <span>{hint}</span>
        </div>
      )}

      <Textarea
        rows={6}
        value={conclusion}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Введите заключение по результатам диагностики"
        className="text-sm leading-6"
      />
    </div>
  );
}