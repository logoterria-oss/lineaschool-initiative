import Icon from '@/components/ui/icon';
import type { UnitMarginInputs, UnitRates, UnitSide } from '@/lib/unitMarginModel';
import type { UnitFact } from '@/lib/unitMarginApi';
import { fmtMoney2 } from '@/lib/unitMarginModel';

interface Props {
  inputs: UnitMarginInputs;
  fact: UnitFact | null;
  onChange: (p: Partial<UnitMarginInputs>) => void;
  onResetFromFact: () => void;
  onSaveDefaults: () => void;
  savingDefaults: boolean;
}

const Num = ({
  label, value, onChange, suffix, hint, step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  hint?: string;
  step?: number;
}) => (
  <div>
    <label className="block text-xs text-gray-500 mb-1">{label}</label>
    <div className="relative">
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      {suffix && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
    {hint && <p className="text-[11px] text-gray-400 mt-1 leading-snug">{hint}</p>}
  </div>
);

/**
 * Что можно править руками: ставку педагога, среднюю цену урока и общие
 * проценты. Цена и размер группы приезжают из факта CRM — трогать их нужно,
 * только если считаем сценарий «а если поднимем цену».
 */
export default function UnitRatesForm({
  inputs, fact, onChange, onResetFromFact, onSaveDefaults, savingDefaults,
}: Props) {
  const side = (key: 'individual' | 'group', p: Partial<UnitSide>) =>
    onChange({ [key]: { ...inputs[key], ...p } } as Partial<UnitMarginInputs>);

  const rates = (p: Partial<UnitRates>) =>
    onChange({ rates: { ...inputs.rates, ...p } });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="SlidersHorizontal" size={17} className="text-amber-600" />
          <h3 className="font-semibold text-gray-900">Ставки и проценты</h3>
        </div>
        <button
          onClick={onResetFromFact}
          disabled={!fact}
          className="text-xs px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Вернуть цены из CRM
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Индивидуальные */}
        <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-900">
            <Icon name="User" size={15} />
            Индивидуальное занятие
          </div>
          <Num
            label="Средняя цена урока"
            value={inputs.individual.price}
            onChange={(v) => side('individual', { price: v })}
            suffix="₽"
            step={10}
            hint={
              fact
                ? `Факт CRM: ${fmtMoney2(fact.individual.avg_price)} — ${fact.individual.revenue.toLocaleString('ru-RU')} ₽ ÷ ${fact.individual.units} зан.`
                : undefined
            }
          />
          <Num
            label="Ставка педагога за урок"
            value={inputs.individual.rate}
            onChange={(v) => side('individual', { rate: v })}
            suffix="₽"
            step={50}
            hint="Сколько школа платит педагогу за проведённое индивидуальное занятие"
          />
        </div>

        {/* Групповые */}
        <div className="rounded-lg border border-violet-100 bg-violet-50/40 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-violet-900">
            <Icon name="Users" size={15} />
            Групповое занятие (на 1 человека)
          </div>
          <Num
            label="Средняя цена урока с человека"
            value={inputs.group.price}
            onChange={(v) => side('group', { price: v })}
            suffix="₽"
            step={10}
            hint={
              fact
                ? `Факт CRM: ${fmtMoney2(fact.group.avg_price)} — ${fact.group.revenue.toLocaleString('ru-RU')} ₽ ÷ ${fact.group.units} посещений`
                : undefined
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Num
              label="Ставка педагога за урок"
              value={inputs.group.rate}
              onChange={(v) => side('group', { rate: v })}
              suffix="₽"
              step={50}
            />
            <Num
              label="Средний размер группы"
              value={inputs.group.groupSize}
              onChange={(v) => side('group', { groupSize: v })}
              suffix="чел."
              step={0.1}
            />
          </div>
          <p className="text-[11px] text-gray-500 leading-snug">
            Час групповой работы делится между детьми: себестоимость одного
            ребёнка — ставка ÷ размер группы.
          </p>
        </div>
      </div>

      {/* Общие проценты */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        <Num
          label="Взносы в СФР"
          value={inputs.rates.sfrPercent}
          onChange={(v) => rates({ sfrPercent: v })}
          suffix="%"
          step={0.1}
          hint="от зарплаты педагога"
        />
        <Num
          label="Эквайринг"
          value={inputs.rates.acquiringPercent}
          onChange={(v) => rates({ acquiringPercent: v })}
          suffix="%"
          step={0.01}
          hint="от оплаты родителя"
        />
        <Num
          label="Делитель отпускных"
          value={inputs.rates.vacationDivisor}
          onChange={(v) => rates({ vacationDivisor: v })}
          step={0.1}
          hint="резерв = зарплата ÷ делитель"
        />
        <div>
          <label className="block text-xs text-gray-500 mb-1">Налог УСН</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step={0.1}
              value={inputs.rates.usnPercent}
              onChange={(e) => rates({ usnPercent: parseFloat(e.target.value) })}
              disabled={!inputs.rates.usnEnabled}
              className="w-20 border border-gray-300 rounded-md px-2.5 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={inputs.rates.usnEnabled}
                onChange={(e) => rates({ usnEnabled: e.target.checked })}
                className="accent-amber-500"
              />
              учитывать
            </label>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 leading-snug">
            налог с выручки, на маржинальность не влияет
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={onSaveDefaults}
          disabled={savingDefaults}
          className="text-xs px-3 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-60 flex items-center gap-1.5"
        >
          <Icon
            name={savingDefaults ? 'Loader2' : 'Save'}
            size={14}
            className={savingDefaults ? 'animate-spin' : ''}
          />
          Запомнить ставки для следующих месяцев
        </button>
      </div>
    </div>
  );
}
