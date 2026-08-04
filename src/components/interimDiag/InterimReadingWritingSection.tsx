import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { ProcessDynamic } from './impairedProcesses';
import {
  ReadingWritingBaseline,
  ReadingWritingState,
  RWMetric,
  dynamicMoreIsBetter,
  dynamicFewerIsBetter,
  effectiveBaseline,
  hasPrimaryBaseline,
} from './readingWriting';

interface Props {
  baseline: ReadingWritingBaseline;
  value: ReadingWritingState;
  onChange: (patch: Partial<ReadingWritingState>) => void;
  selected: boolean;
}

function DynamicArrow({ dyn }: { dyn: ProcessDynamic }) {
  if (dyn === 'up') return <Icon name="ArrowUp" size={18} className="text-green-600" />;
  if (dyn === 'down') return <Icon name="ArrowDown" size={18} className="text-red-600" />;
  return null;
}

interface CompareRowProps {
  label: string;
  unit?: string;
  from: string;
  fromEditable: boolean;
  to: string;
  dyn: ProcessDynamic;
  onFromChange: (v: string) => void;
  onChange: (v: string) => void;
}

function CompareRow({ label, unit, from, fromEditable, to, dyn, onFromChange, onChange }: CompareRowProps) {
  return (
    <div>
      <Label className="text-sm text-gray-700">{label}</Label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {fromEditable ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              inputMode="numeric"
              value={from}
              onChange={(e) => onFromChange(e.target.value)}
              className="w-28"
              placeholder="было"
            />
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
        ) : (
          <span className="text-sm text-gray-500 min-w-[70px]">
            {`${from}${unit ? ' ' + unit : ''}`}
          </span>
        )}
        <Icon name="ArrowRight" size={16} className="text-gray-400" />
        <Input
          type="number"
          inputMode="numeric"
          value={to}
          onChange={(e) => onChange(e.target.value)}
          className="w-28"
          placeholder="0"
        />
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
        <DynamicArrow dyn={dyn} />
      </div>
    </div>
  );
}

export default function InterimReadingWritingSection({ baseline, value, onChange, selected }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = 3 - value.writingSamples.length;
    const toRead = Array.from(files).slice(0, Math.max(0, remaining));
    toRead.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        onChange({ writingSamples: [...value.writingSamples, reader.result as string] });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSample = (idx: number) => {
    onChange({ writingSamples: value.writingSamples.filter((_, i) => i !== idx) });
  };

  const fromValue = (metric: RWMetric) => effectiveBaseline(metric, baseline, value);
  const fromEditable = (metric: RWMetric) => !hasPrimaryBaseline(metric, baseline);
  const setFrom = (metric: RWMetric, v: string) =>
    onChange({ baselineOverride: { ...value.baselineOverride, [metric]: v } });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Чтение и письмо</h2>
      <p className="text-sm text-gray-500 mb-6">
        {selected
          ? 'Показатели «было» подтянуты из первичной диагностики. Если данных нет — введите их вручную. Заполните текущие значения.'
          : 'Выберите ученика в разделе выше — показатели «было» заполнятся из первичной диагностики.'}
      </p>

      {/* Подраздел «Чтение» */}
      <h3 className="text-base font-semibold text-gray-900 mb-3">Чтение</h3>
      <div className="space-y-4 mb-8">
        <CompareRow
          label="Скорость чтения"
          unit="сл/мин"
          from={fromValue('readingSpeed')}
          fromEditable={fromEditable('readingSpeed')}
          to={value.readingSpeed}
          dyn={dynamicMoreIsBetter(fromValue('readingSpeed'), value.readingSpeed)}
          onFromChange={(v) => setFrom('readingSpeed', v)}
          onChange={(v) => onChange({ readingSpeed: v })}
        />
        <CompareRow
          label="Понимание прочитанного"
          unit="%"
          from={fromValue('readingComprehension')}
          fromEditable={fromEditable('readingComprehension')}
          to={value.readingComprehension}
          dyn={dynamicMoreIsBetter(fromValue('readingComprehension'), value.readingComprehension)}
          onFromChange={(v) => setFrom('readingComprehension', v)}
          onChange={(v) => onChange({ readingComprehension: v })}
        />
        <div>
          <Label htmlFor="rw-reading-errors" className="text-sm text-gray-700">
            Тип ошибок
          </Label>
          <Textarea
            id="rw-reading-errors"
            value={value.readingErrorTypes}
            onChange={(e) => onChange({ readingErrorTypes: e.target.value })}
            className="mt-2"
            rows={3}
            placeholder="Опишите типы ошибок при чтении"
          />
        </div>
      </div>

      {/* Подраздел «Письмо» */}
      <h3 className="text-base font-semibold text-gray-900 mb-3">Письмо</h3>
      <div className="space-y-4">
        <div>
          <Label className="text-sm text-gray-700">Образцы письменных работ</Label>
          <div className="mt-2 flex flex-wrap gap-3">
            {value.writingSamples.map((src, idx) => (
              <div key={idx} className="relative">
                <img
                  src={src}
                  alt={`Образец ${idx + 1}`}
                  className="h-28 w-28 rounded-lg object-cover border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeSample(idx)}
                  className="absolute -top-2 -right-2 bg-white rounded-full border border-gray-300 shadow-sm p-0.5 hover:bg-gray-50"
                >
                  <Icon name="X" size={14} className="text-gray-600" />
                </button>
              </div>
            ))}
            {value.writingSamples.length < 3 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-28 w-28 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500"
              >
                <Icon name="ImagePlus" size={24} />
                <span className="text-xs mt-1">Добавить</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        <CompareRow
          label="Количество дисграфических ошибок"
          from={fromValue('dysgraphicErrors')}
          fromEditable={fromEditable('dysgraphicErrors')}
          to={value.dysgraphicErrors}
          dyn={dynamicFewerIsBetter(fromValue('dysgraphicErrors'), value.dysgraphicErrors)}
          onFromChange={(v) => setFrom('dysgraphicErrors', v)}
          onChange={(v) => onChange({ dysgraphicErrors: v })}
        />
        <CompareRow
          label="Количество орфографических ошибок"
          from={fromValue('dysorthographicErrors')}
          fromEditable={fromEditable('dysorthographicErrors')}
          to={value.dysorthographicErrors}
          dyn={dynamicFewerIsBetter(fromValue('dysorthographicErrors'), value.dysorthographicErrors)}
          onFromChange={(v) => setFrom('dysorthographicErrors', v)}
          onChange={(v) => onChange({ dysorthographicErrors: v })}
        />
      </div>
    </div>
  );
}