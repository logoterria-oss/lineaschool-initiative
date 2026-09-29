import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { fmtMoney, fmtMoney2 } from '@/lib/unitMarginModel';
import type { WeightedRate } from '@/lib/unitTeacherRates';

interface Props {
  individual: WeightedRate;
  group: WeightedRate;
  periodLabel: string;
  /** Ставки, которые стояли в отчёте до уточнения — для сравнения. */
  flatIndividual: number;
  flatGroup: number;
  applied: boolean;
  onToggle: (v: boolean) => void;
}

const SOURCE_LABEL: Record<string, string> = {
  manual: 'задана вручную',
  locked: 'зафиксирована',
  score: 'по баллам супервизий',
  base: 'базовая',
};

/**
 * Разбор средневзвешенной ставки педагогов.
 *
 * Показываем не только итог, но и КТО его сформировал: ставка педагога
 * умножается на число его занятий. Так руководитель может проверить
 * каждую цифру и увидеть, чьи занятия тянут среднюю вверх или вниз.
 */
export default function UnitWeightedRateCard({
  individual, group, periodLabel, flatIndividual, flatGroup, applied, onToggle,
}: Props) {
  const [open, setOpen] = useState(false);

  const block = (w: WeightedRate, title: string, icon: string, flat: number) => {
    const diff = w.rate - flat;
    return (
      <div className="rounded-lg bg-gray-50 p-3.5">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Icon name={icon as never} size={13} />
          {title}
        </div>
        <div className="text-lg font-bold text-gray-900 mt-1">
          {w.lessons > 0 ? fmtMoney2(w.rate) : '—'}
        </div>
        {w.lessons > 0 && (
          <div className="text-[11px] text-gray-400 mt-0.5">
            {w.lessons} зан.
            {Math.abs(diff) >= 0.5 && (
              <span className={diff > 0 ? 'text-red-500' : 'text-emerald-600'}>
                {' '}· {diff > 0 ? '+' : ''}{Math.round(diff)} ₽ к прежней {fmtMoney(flat)}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const allRows = [...individual.rows, ...group.rows];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-sky-200 bg-sky-50/60 text-sky-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="Scale" size={17} />
              <h3 className="font-semibold">Ставки педагогов</h3>
            </div>
            <p className="text-xs opacity-70 mt-0.5">
              из раздела «Супервизии → Ставки», период {periodLabel}
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs cursor-pointer shrink-0 pt-0.5">
            <input
              type="checkbox"
              checked={applied}
              onChange={(e) => onToggle(e.target.checked)}
              className="accent-sky-600"
            />
            учитывать в расчёте
          </label>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {block(individual, 'Индивидуальные', 'User', flatIndividual)}
          {block(group, 'Групповые', 'Users', flatGroup)}
        </div>

        {!applied && (
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
            Сейчас в расчёте стоит одна общая ставка на всех педагогов.
            Включите галочку, чтобы считать по реальным ставкам каждого.
          </div>
        )}

        {allRows.length > 0 && (
          <>
            <button
              onClick={() => setOpen((v) => !v)}
              className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1.5"
            >
              <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={14} />
              {open ? 'Скрыть разбор' : 'Показать, из чего сложилась средняя'}
            </button>

            {open && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] text-gray-400 border-b border-gray-100">
                      <th className="py-2 pr-3 font-medium">Педагог</th>
                      <th className="py-2 px-3 font-medium">Форма</th>
                      <th className="py-2 px-3 font-medium text-right">Занятий</th>
                      <th className="py-2 px-3 font-medium text-right">Ставка</th>
                      <th className="py-2 pl-3 font-medium">Откуда</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allRows.map((r) => (
                      <tr key={`${r.teacherId}-${r.form}`} className="text-gray-700">
                        <td className="py-2 pr-3 font-medium text-gray-900">{r.name}</td>
                        <td className="py-2 px-3 text-gray-500">
                          {r.form === 'group' ? 'групповые' : 'индивид.'}
                        </td>
                        <td className="py-2 px-3 text-right">{r.lessons}</td>
                        <td className="py-2 px-3 text-right font-medium">
                          {fmtMoney(r.rate)}
                        </td>
                        <td className="py-2 pl-3 text-[11px] text-gray-400">
                          {SOURCE_LABEL[r.source]}
                          {r.source === 'score' && r.avgScore !== null && (
                            <> · {r.avgScore} балла</>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
                  Средняя считается средневзвешенно: ставка каждого педагога
                  умножается на число его занятий, сумма делится на все занятия.
                  Поэтому педагог с 60 уроками влияет на неё сильнее того, кто
                  провёл два. Ставка — оплата за проведённое занятие целиком.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
