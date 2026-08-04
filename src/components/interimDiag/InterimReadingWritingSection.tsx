import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import { ProcessDynamic } from './impairedProcesses';
import {
  DYSGRAPHIC_ERROR_CATALOG,
  ORTHOGRAPHIC_ERROR_CATALOG,
  DysgraphicErrorItem,
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

  const toggleStruck = (idx: number) => {
    const next = value.errorTypes.map((it, i) =>
      i === idx ? { ...it, struck: !it.struck } : it,
    );
    onChange({ errorTypes: next });
  };

  const removeAdded = (idx: number) => {
    onChange({ errorTypes: value.errorTypes.filter((_, i) => i !== idx) });
  };

  const addErrorType = (label: string) => {
    const exists = value.errorTypes.some(
      (it) => it.label.toLowerCase() === label.toLowerCase(),
    );
    if (exists) return;
    const item: DysgraphicErrorItem = { label, struck: false, added: true };
    onChange({ errorTypes: [...value.errorTypes, item] });
  };

  const toggleOrthoStruck = (idx: number) => {
    const next = value.orthoErrorTypes.map((it, i) =>
      i === idx ? { ...it, struck: !it.struck } : it,
    );
    onChange({ orthoErrorTypes: next });
  };

  const removeOrthoAdded = (idx: number) => {
    onChange({ orthoErrorTypes: value.orthoErrorTypes.filter((_, i) => i !== idx) });
  };

  const addOrthoType = (label: string) => {
    const exists = value.orthoErrorTypes.some(
      (it) => it.label.toLowerCase() === label.toLowerCase(),
    );
    if (exists) return;
    const item: DysgraphicErrorItem = { label, struck: false, added: true };
    onChange({ orthoErrorTypes: [...value.orthoErrorTypes, item] });
  };

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
        <CompareRow
          label="Ошибок всего"
          from={fromValue('totalErrors')}
          fromEditable={fromEditable('totalErrors')}
          to={value.totalErrors}
          dyn={dynamicFewerIsBetter(fromValue('totalErrors'), value.totalErrors)}
          onFromChange={(v) => setFrom('totalErrors', v)}
          onChange={(v) => onChange({ totalErrors: v })}
        />

        <ErrorTypesBlock
          title="Типы дисграфических ошибок"
          addLabel="Добавить тип ошибки"
          catalog={DYSGRAPHIC_ERROR_CATALOG}
          items={value.errorTypes}
          onToggleStruck={toggleStruck}
          onRemoveAdded={removeAdded}
          onAdd={addErrorType}
        />

        <ErrorTypesBlock
          title="Орфографические ошибки"
          addLabel="Добавить орфографическую ошибку"
          catalog={ORTHOGRAPHIC_ERROR_CATALOG}
          items={value.orthoErrorTypes}
          onToggleStruck={toggleOrthoStruck}
          onRemoveAdded={removeOrthoAdded}
          onAdd={addOrthoType}
        />
      </div>
    </div>
  );
}

interface ErrorTypesBlockProps {
  items: DysgraphicErrorItem[];
  onToggleStruck: (idx: number) => void;
  onRemoveAdded: (idx: number) => void;
  onAdd: (label: string) => void;
  title: string;
  addLabel: string;
  catalog: { group: string; items: string[] }[];
}

function ErrorTypesBlock({
  items,
  onToggleStruck,
  onRemoveAdded,
  onAdd,
  title,
  addLabel,
  catalog,
}: ErrorTypesBlockProps) {
  const [open, setOpen] = useState(false);
  const chosen = new Set(items.map((it) => it.label.toLowerCase()));

  return (
    <div>
      <Label className="text-sm text-gray-700">{title}</Label>
      <p className="text-xs text-gray-400 mt-1">
        Вычеркните ошибки, которых больше нет, и добавьте новые типы.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((it, idx) => (
          <div
            key={`${it.label}-${idx}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
              it.added
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-gray-200 bg-gray-50 text-gray-800'
            } ${it.struck ? 'opacity-60' : ''}`}
          >
            <span className={it.struck ? 'line-through' : ''}>
              {it.added ? '+' : ''}
              {it.label}
            </span>
            {it.added ? (
              <button
                type="button"
                onClick={() => onRemoveAdded(idx)}
                title="Удалить"
                className="text-red-500 hover:text-red-700"
              >
                <Icon name="X" size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleStruck(idx)}
                title={it.struck ? 'Вернуть' : 'Вычеркнуть'}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon name={it.struck ? 'RotateCcw' : 'Strikethrough'} size={14} />
              </button>
            )}
          </div>
        ))}

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-white px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Icon name="Plus" size={14} />
              {addLabel}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto w-80">
            {catalog.map((group) => (
              <div key={group.group}>
                <DropdownMenuLabel className="text-xs text-gray-500">
                  {group.group}
                </DropdownMenuLabel>
                {group.items.map((label) => {
                  const already = chosen.has(label.toLowerCase());
                  return (
                    <DropdownMenuItem
                      key={label}
                      disabled={already}
                      onSelect={() => onAdd(label)}
                      className="text-sm"
                    >
                      {label}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}