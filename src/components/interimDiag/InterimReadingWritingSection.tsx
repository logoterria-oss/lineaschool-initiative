import Icon from '@/components/ui/icon';
import { useRef } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProcessDynamic } from './impairedProcesses';
import {
  DYSGRAPHIC_ERROR_CATALOG,
  ORTHOGRAPHIC_ERROR_CATALOG,
  READING_ERROR_CATALOG,
  READING_CHAR_LEVELS,
  DysgraphicErrorItem,
  ReadingWritingBaseline,
  ReadingWritingState,
  RWMetric,
  dynamicMoreIsBetter,
  dynamicFewerIsBetter,
  effectiveBaseline,
  hasPrimaryBaseline,
  readingCharIndex,
} from './readingWriting';
import { fmtRate, per100, rateChangeText, rateDynamic, rateLabel } from './errorRate';
import DynamicChain, { ChainStep } from './DynamicChain';
import { InterimHistoryEntry } from './InterimPersonalDataSection';
import CompareRow from './ReadingWritingCompareRow';
import ErrorTypesBlock from './ReadingWritingErrorTypesBlock';
import ReadingWritingSamples from './ReadingWritingSamples';
import DictationPicker from '@/components/dictations/DictationPicker';
import { INTERIM_SETS } from '@/components/dictations/dictationCatalog';

const MAX_WRITING_SAMPLES = 2;

interface Props {
  baseline: ReadingWritingBaseline;
  value: ReadingWritingState;
  history: InterimHistoryEntry[];
  primaryDate: string | null;
  todayDate: string;
  primarySamples: string[];
  interimSamples: string[];
  interimSamplesDate: string | null;
  onImageClick: (src: string) => void;
  onChange: (patch: Partial<ReadingWritingState>) => void;
  selected: boolean;
  grade?: string;
}

export default function InterimReadingWritingSection({
  baseline,
  value,
  history,
  primaryDate,
  todayDate,
  primarySamples,
  interimSamples,
  interimSamplesDate,
  onImageClick,
  onChange,
  selected,
  grade,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  // Полная цепочка «первичная → промежуточные → сейчас» для одного показателя.
  // Показываем только когда есть история промежуточных замеров.
  const metricSteps = (metric: RWMetric, current: string): ChainStep[] => {
    if (!history || history.length === 0) return [];
    const steps: ChainStep[] = [];
    const base = fromValue(metric);
    if (base) steps.push({ date: primaryDate, value: base });
    history.forEach((h) => {
      const v = (h[metric] as string) || '';
      if (v) steps.push({ date: h.date, value: v });
    });
    if (current) steps.push({ date: todayDate, value: current });
    return steps;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_WRITING_SAMPLES - value.writingSamples.length;
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

  const toggleReadStruck = (idx: number) => {
    const next = value.readingErrorTypes.map((it, i) =>
      i === idx ? { ...it, struck: !it.struck } : it,
    );
    onChange({ readingErrorTypes: next });
  };

  const removeReadAdded = (idx: number) => {
    onChange({ readingErrorTypes: value.readingErrorTypes.filter((_, i) => i !== idx) });
  };

  const addReadType = (label: string) => {
    const exists = value.readingErrorTypes.some(
      (it) => it.label.toLowerCase() === label.toLowerCase(),
    );
    if (exists) return;
    const item: DysgraphicErrorItem = { label, struck: false, added: true };
    onChange({ readingErrorTypes: [...value.readingErrorTypes, item] });
  };

  const num = (s: string) => {
    const n = Number((s || '').replace(',', '.').trim());
    return Number.isFinite(n) && (s || '').trim() !== '' ? n : null;
  };

  const renderChain = (metric: RWMetric, current: string, moreIsBetter: boolean) => {
    const steps = metricSteps(metric, current);
    if (steps.length < 2) return null;
    const a = num(steps[steps.length - 2].value);
    const b = num(steps[steps.length - 1].value);
    let dyn: ProcessDynamic = 'same';
    if (a !== null && b !== null && a !== b) {
      const improved = moreIsBetter ? b > a : b < a;
      dyn = improved ? 'up' : 'down';
    }
    return <DynamicChain steps={steps} finalDynamic={dyn} />;
  };

  /* Ошибки сравниваем не в штуках, а в пересчёте на 100 слов:
     20 ошибок в диктанте на 50 слов и на 100 слов — разный результат.
     Если объём работы где-то не указан, откатываемся на абсолютные числа. */
  type ErrorMetric = 'dysgraphicErrors' | 'dysorthographicErrors' | 'totalErrors';

  const baseWords = () => fromValue('dictationWords');

  const errorDynamic = (metric: ErrorMetric): ProcessDynamic => {
    const byRate = rateDynamic(fromValue(metric), baseWords(), value[metric], value.dictationWords);
    if (per100(fromValue(metric), baseWords()) !== null) return byRate;
    return dynamicFewerIsBetter(fromValue(metric), value[metric]);
  };

  const errorNote = (metric: ErrorMetric): string => {
    const from = per100(fromValue(metric), baseWords());
    const to = per100(value[metric], value.dictationWords);
    if (from === null || to === null) return '';
    const change = rateChangeText(fromValue(metric), baseWords(), value[metric], value.dictationWords);
    return `${fmtRate(from)} → ${fmtRate(to)} на 100 слов — ${change}`;
  };

  /* Подсказка: ошибки заполнены, а объём работы — нет.
     Без объёма показатели нельзя сравнить между работами разной длины,
     поэтому напоминаем внести количество слов. */
  const ERROR_KEYS: ErrorMetric[] = ['dysgraphicErrors', 'dysorthographicErrors', 'totalErrors'];
  const hasErrors = ERROR_KEYS.some((k) => (value[k] || '').trim() !== '');
  const missingCurrentWords = hasErrors && (value.dictationWords || '').trim() === '';
  const missingBaseWords =
    hasErrors &&
    ERROR_KEYS.some((k) => (fromValue(k) || '').trim() !== '') &&
    (baseWords() || '').trim() === '';

  /* Цепочка ошибок. Пересчёт на 100 слов включаем только когда объём
     работы известен у всех замеров — иначе в одной строке смешались бы
     штуки и «на 100 слов», а такие числа несравнимы. */
  const renderErrorChain = (metric: ErrorMetric) => {
    if (!history || history.length === 0) return null;
    const points: { date: string | null; value: string; words?: string }[] = [];
    const base = fromValue(metric);
    if (base) points.push({ date: primaryDate, value: base, words: baseWords() });
    history.forEach((h) => {
      const v = (h[metric] as string) || '';
      if (v) points.push({ date: h.date, value: v, words: h.dictationWords });
    });
    if (value[metric])
      points.push({ date: todayDate, value: value[metric], words: value.dictationWords });
    if (points.length < 2) return null;

    const canCompare = points.every((p) => per100(p.value, p.words) !== null);
    const steps: ChainStep[] = points.map((p) => ({
      date: p.date,
      value: canCompare ? rateLabel(p.value, p.words) : p.value,
    }));
    return <DynamicChain steps={steps} finalDynamic={errorDynamic(metric)} />;
  };

  // Цепочка характера чтения: первичная → промежуточные → сейчас
  const readingCharSteps = (): ChainStep[] => {
    const steps: ChainStep[] = [];
    if (baseline.readingChar) steps.push({ date: primaryDate, value: baseline.readingChar });
    (history || []).forEach((h) => {
      if (h.readingChar) steps.push({ date: h.date, value: h.readingChar });
    });
    if (value.readingChar) steps.push({ date: todayDate, value: value.readingChar });
    return steps;
  };

  const renderReadingCharChain = () => {
    const steps = readingCharSteps();
    if (steps.length < 2) return null;
    const a = readingCharIndex(steps[steps.length - 2].value);
    const b = readingCharIndex(steps[steps.length - 1].value);
    let dyn: ProcessDynamic = 'same';
    if (a >= 0 && b >= 0 && a !== b) dyn = b > a ? 'up' : 'down';
    return <DynamicChain steps={steps} finalDynamic={dyn} />;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Чтение и письмо</h2>
      <p className="text-sm text-gray-500 mb-6">
        {selected
          ? 'Показатели «было» подтянуты из первичной диагностики. Если данных нет — введите их вручную. Заполните текущие значения.'
          : 'Если первичной диагностики нет — введите показатели «было» и текущие значения вручную.'}
      </p>

      {/* Подраздел «Чтение» */}
      <h3 className="text-base font-semibold text-gray-900 mb-3">Чтение</h3>
      <div className="space-y-4 mb-8">
        <div>
          <Label className="text-sm text-gray-700">Характер чтения</Label>
          <div className="mt-2">
            <Select
              value={value.readingChar || undefined}
              onValueChange={(v) => onChange({ readingChar: v })}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Выберите характер чтения" />
              </SelectTrigger>
              <SelectContent>
                {READING_CHAR_LEVELS.map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>
                    {lvl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {renderReadingCharChain()}
        </div>
        <div>
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
          {renderChain('readingSpeed', value.readingSpeed, true)}
        </div>
        <div>
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
          {renderChain('readingComprehension', value.readingComprehension, true)}
        </div>
        <ErrorTypesBlock
          title="Тип ошибок"
          addLabel="Добавить ошибку чтения"
          catalog={READING_ERROR_CATALOG}
          items={value.readingErrorTypes}
          onToggleStruck={toggleReadStruck}
          onRemoveAdded={removeReadAdded}
          onAdd={addReadType}
        />
      </div>

      {/* Подраздел «Письмо» */}
      <h3 className="text-base font-semibold text-gray-900 mb-3">Письмо</h3>
      <div className="space-y-4">
        <ReadingWritingSamples
          maxSamples={MAX_WRITING_SAMPLES}
          writingSamples={value.writingSamples}
          primarySamples={primarySamples}
          interimSamples={interimSamples}
          interimSamplesDate={interimSamplesDate}
          fileRef={fileRef}
          onImageClick={onImageClick}
          onRemoveSample={removeSample}
          onFiles={handleFiles}
        />

        <div>
          <CompareRow
            label="Количество слов в работе"
            hint="Позволяет сравнивать ошибки между диктантами разной длины"
            from={fromValue('dictationWords')}
            fromEditable={fromEditable('dictationWords')}
            to={value.dictationWords}
            dyn="same"
            onFromChange={(v) => setFrom('dictationWords', v)}
            onChange={(v) => onChange({ dictationWords: v })}
          />
          <div className="mt-2">
            <Label className="text-sm text-gray-700">Диктант сегодняшней работы</Label>
            <p className="mt-0.5 text-xs text-gray-500">
              Выберите диктант — количество слов подставится само
            </p>
            <DictationPicker
              sets={INTERIM_SETS}
              words={value.dictationWords}
              grade={grade}
              hideWordsInput
              onWordsChange={(v) => onChange({ dictationWords: v })}
              className="mt-2"
            />
          </div>
          {(missingCurrentWords || missingBaseWords) && (
            <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5">
              <Icon name="TriangleAlert" size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-900">
                {missingCurrentWords && missingBaseWords
                  ? 'Укажите количество слов в обеих работах — иначе ошибки будут показаны в штуках, без пересчёта на 100 слов.'
                  : missingCurrentWords
                    ? 'Укажите количество слов в сегодняшней работе — иначе ошибки будут показаны в штуках, без пересчёта на 100 слов.'
                    : 'Укажите количество слов в прошлой работе (поле «было») — иначе ошибки будут показаны в штуках, без пересчёта на 100 слов.'}
              </p>
            </div>
          )}
        </div>
        <div>
          <CompareRow
            label="Количество дисграфических ошибок"
            from={fromValue('dysgraphicErrors')}
            fromEditable={fromEditable('dysgraphicErrors')}
            to={value.dysgraphicErrors}
            dyn={errorDynamic('dysgraphicErrors')}
            note={errorNote('dysgraphicErrors')}
            onFromChange={(v) => setFrom('dysgraphicErrors', v)}
            onChange={(v) => onChange({ dysgraphicErrors: v })}
          />
          {renderErrorChain('dysgraphicErrors')}
        </div>
        <div>
          <CompareRow
            label="Количество орфографических ошибок"
            from={fromValue('dysorthographicErrors')}
            fromEditable={fromEditable('dysorthographicErrors')}
            to={value.dysorthographicErrors}
            dyn={errorDynamic('dysorthographicErrors')}
            note={errorNote('dysorthographicErrors')}
            onFromChange={(v) => setFrom('dysorthographicErrors', v)}
            onChange={(v) => onChange({ dysorthographicErrors: v })}
          />
          {renderErrorChain('dysorthographicErrors')}
        </div>
        <div>
          <CompareRow
            label="Ошибок всего"
            from={fromValue('totalErrors')}
            fromEditable={fromEditable('totalErrors')}
            to={value.totalErrors}
            dyn={errorDynamic('totalErrors')}
            note={errorNote('totalErrors')}
            onFromChange={(v) => setFrom('totalErrors', v)}
            onChange={(v) => onChange({ totalErrors: v })}
          />
          {renderErrorChain('totalErrors')}
        </div>

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
          title="Типы орфографических ошибок"
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