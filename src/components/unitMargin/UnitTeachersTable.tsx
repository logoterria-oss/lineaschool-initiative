import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { UnitMarginInputs, calcUnit, fmtMoney2, fmtPercent } from '@/lib/unitMarginModel';
import type { UnitFactTeacher } from '@/lib/unitMarginApi';

interface Props {
  teachers: UnitFactTeacher[];
  inputs: UnitMarginInputs;
}

/**
 * Разрез по педагогам: у каждого своя средняя оплата ребёнка и своя
 * наполняемость групп, поэтому и маржа занятия разная. Ставки берём общие —
 * видно, кто приносит больше за счёт полных групп.
 */
export default function UnitTeachersTable({ teachers, inputs }: Props) {
  const [open, setOpen] = useState(false);
  const rows = teachers.filter((t) => t.group_units + t.individual_units > 0);
  if (!rows.length) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-2">
          <Icon name="GraduationCap" size={17} className="text-gray-500" />
          <span className="font-semibold text-gray-900">
            Разрез по педагогам ({rows.length})
          </span>
        </div>
        <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={17} className="text-gray-400" />
      </button>

      {open && (
        <div className="px-5 pb-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-3 font-medium">Педагог</th>
                <th className="py-2 px-3 font-medium text-right">Инд. уроков</th>
                <th className="py-2 px-3 font-medium text-right">Ср. цена инд.</th>
                <th className="py-2 px-3 font-medium text-right">Маржа инд.</th>
                <th className="py-2 px-3 font-medium text-right">Гр. занятий</th>
                <th className="py-2 px-3 font-medium text-right">Наполн.</th>
                <th className="py-2 px-3 font-medium text-right">Выручка занятия</th>
                <th className="py-2 pl-3 font-medium text-right">Маржа гр.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((t) => {
                // Средняя цена — по ОПЛАЧЕННЫМ местам: бесплатные отработки
                // выручки не дают и среднюю занижать не должны.
                const indPrice = t.individual_paid_units
                  ? t.individual_revenue / t.individual_paid_units
                  : 0;
                const grPrice = t.group_paid_units
                  ? t.group_revenue / t.group_paid_units
                  : 0;
                const ind = calcUnit(
                  'individual',
                  {
                    ...inputs.individual,
                    price: indPrice,
                    groupSize: t.individual_lessons
                      ? t.individual_paid_units / t.individual_lessons
                      : 1,
                  },
                  inputs.rates,
                );
                const gr = calcUnit(
                  'group',
                  {
                    ...inputs.group,
                    price: grPrice,
                    groupSize: t.avg_group_size || inputs.group.groupSize,
                  },
                  inputs.rates,
                );
                const tone = (v: number) =>
                  v >= 0 ? 'text-emerald-600' : 'text-red-600';
                return (
                  <tr key={t.teacher_id} className="text-gray-700">
                    <td className="py-2 pr-3 font-medium text-gray-900">{t.name}</td>
                    <td className="py-2 px-3 text-right">{t.individual_units || '—'}</td>
                    <td className="py-2 px-3 text-right">
                      {t.individual_units ? fmtMoney2(indPrice) : '—'}
                    </td>
                    <td className={`py-2 px-3 text-right font-medium ${t.individual_units ? tone(ind.margin) : ''}`}>
                      {t.individual_units ? fmtPercent(ind.marginPercent) : '—'}
                    </td>
                    <td className="py-2 px-3 text-right">{t.group_lessons || '—'}</td>
                    <td
                      className="py-2 px-3 text-right"
                      title={
                        t.group_lessons
                          ? `физически на занятии ${t.avg_present_size} чел.`
                          : undefined
                      }
                    >
                      {t.group_lessons ? `${t.avg_group_size} опл.` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {t.group_units ? fmtMoney2(gr.revenue) : '—'}
                    </td>
                    <td className={`py-2 pl-3 text-right font-medium ${t.group_units ? tone(gr.margin) : ''}`}>
                      {t.group_units ? fmtPercent(gr.marginPercent) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
            Ставки педагога взяты общие из формы. Выручка группового занятия —
            средняя оплата ребёнка × фактическая наполняемость у этого педагога:
            чем полнее группа, тем выше маржа с того же часа работы.
          </p>
        </div>
      )}
    </div>
  );
}