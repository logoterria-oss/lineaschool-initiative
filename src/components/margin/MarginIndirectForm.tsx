import Icon from '@/components/ui/icon';
import { MarginInputs, IndirectLine, fmtMoney } from '@/lib/marginModel';

interface Props {
  inputs: MarginInputs;
  onChange: (patch: Partial<MarginInputs>) => void;
  /** Доля абонемента в расходах школы, 0..1 — считается моделью. */
  share: number;
  onSaveDefaults: () => void;
  savingDefaults: boolean;
}

const num = (v: string) => {
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const cell =
  'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400';

export default function MarginIndirectForm({
  inputs, onChange, share, onSaveDefaults, savingDefaults,
}: Props) {
  const setLine = (id: string, patch: Partial<IndirectLine>) =>
    onChange({
      indirect: inputs.indirect.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });

  const addLine = () =>
    onChange({
      indirect: [
        ...inputs.indirect,
        { id: `i${Date.now()}`, label: '', amount: 0 },
      ],
    });

  const removeLine = (id: string) =>
    onChange({ indirect: inputs.indirect.filter((l) => l.id !== id) });

  const fullTotal = inputs.indirect.reduce(
    (s, l) =>
      s + (l.amount || 0) + (l.percentOfRevenue ? (inputs.schoolRevenue * l.percentOfRevenue) / 100 : 0),
    0,
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <Icon name="Building2" size={18} className="text-violet-600" />
          <h2 className="font-semibold text-gray-900">Косвенные расходы</h2>
        </div>
        <button
          onClick={onSaveDefaults}
          disabled={savingDefaults}
          className="text-xs px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          title="Запомнить эти суммы как значения по умолчанию для новых отчётов"
        >
          {savingDefaults ? 'Сохраняю…' : 'Сделать пресетом'}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-3">
        Содержание школы целиком. На абонемент ложится доля по числу занятий:{' '}
        <b>{(share * 100).toFixed(2)}%</b> от {fmtMoney(fullTotal)} в месяц.
      </p>

      {/* Сверка «на берегу»: если общие расходы больше всей выручки школы,
          ни один абонемент не сможет выйти в плюс — и это надо видеть сразу,
          а не искать причину в цифрах конкретного тарифа. */}
      {inputs.schoolRevenue > 0 && fullTotal > inputs.schoolRevenue && (
        <div className="mb-4 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <b>Косвенные расходы больше всей выручки школы:</b>{' '}
          {fmtMoney(fullTotal)} против {fmtMoney(inputs.schoolRevenue)} за месяц.
          При таком раскладе в минус уйдёт любой абонемент — дело не в цене
          тарифа, а в том, что постоянные расходы не покрыты объёмом учеников.
          Чтобы выйти в ноль, нужно примерно{' '}
          <b>
            ×{(fullTotal / inputs.schoolRevenue).toFixed(1)}
          </b>{' '}
          больше занятий при тех же ценах.
        </div>
      )}

      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-xs text-gray-500 text-left">
              <th className="pb-1.5 font-medium">Статья</th>
              <th className="pb-1.5 font-medium w-36">Сумма/мес., ₽</th>
              <th className="pb-1.5 font-medium w-32">% от выручки</th>
              <th className="pb-1.5 font-medium w-32 text-right">Доля абонемента</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {inputs.indirect.map((l) => {
              const full =
                (l.amount || 0) +
                (l.percentOfRevenue ? (inputs.schoolRevenue * l.percentOfRevenue) / 100 : 0);
              return (
                <tr key={l.id} className="border-t border-gray-100 align-top">
                  <td className="py-1.5 pr-2">
                    <input
                      value={l.label}
                      placeholder="название статьи"
                      onChange={(e) => setLine(l.id, { label: e.target.value })}
                      className={cell}
                    />
                    {l.hint && (
                      <div className="text-[11px] text-gray-400 mt-1">{l.hint}</div>
                    )}
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      value={l.amount}
                      onChange={(e) => setLine(l.id, { amount: num(e.target.value) })}
                      className={cell}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      step="0.1"
                      value={l.percentOfRevenue ?? ''}
                      placeholder="—"
                      onChange={(e) =>
                        setLine(l.id, {
                          percentOfRevenue: e.target.value ? num(e.target.value) : undefined,
                        })
                      }
                      className={cell}
                    />
                  </td>
                  <td className="py-1.5 text-right text-gray-700 whitespace-nowrap">
                    {fmtMoney(full * share)}
                  </td>
                  <td className="py-1.5 text-right">
                    <button
                      onClick={() => removeLine(l.id)}
                      className="text-gray-300 hover:text-red-500"
                      title="Убрать статью"
                    >
                      <Icon name="X" size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={addLine}
        className="mt-3 text-xs px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
      >
        + статья расходов
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Выручка школы/мес., ₽</label>
          <input
            type="number"
            value={inputs.schoolRevenue}
            onChange={(e) => onChange({ schoolRevenue: num(e.target.value) })}
            className={cell}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ученико-уроков/мес.</label>
          <input
            type="number"
            value={inputs.schoolStudentLessons}
            onChange={(e) => onChange({ schoolStudentLessons: num(e.target.value) })}
            className={cell}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Налог УСН, %</label>
          <input
            type="number"
            step="0.1"
            value={inputs.usnPercent}
            onChange={(e) => onChange({ usnPercent: num(e.target.value) })}
            className={cell}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Вычет взносов, не более %
          </label>
          <input
            type="number"
            step="1"
            value={inputs.usnReduceLimitPercent}
            onChange={(e) => onChange({ usnReduceLimitPercent: num(e.target.value) })}
            className={cell}
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Выручка и ученико-уроки подставляются из CRM за выбранный месяц — по ним
        считается, какая часть общих расходов приходится на абонемент.
      </p>
    </div>
  );
}