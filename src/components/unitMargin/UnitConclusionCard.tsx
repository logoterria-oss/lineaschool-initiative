import Icon from '@/components/ui/icon';
import {
  UnitMarginResults, fmtMoney2, fmtPercent, monthLabel,
} from '@/lib/unitMarginModel';

interface Props {
  result: UnitMarginResults;
  month: string;
  /** Какая форма занятий выгоднее — «индивидуальные» или «групповые». */
  better: string;
  /** Разрыв маржинальности между формами, п.п. */
  diff: string;
}

/** Вывод за месяц: словами, что показал расчёт и какая форма выгоднее. */
export default function UnitConclusionCard({ result, month, better, diff }: Props) {
  return (
    <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="Lightbulb" size={18} className="text-amber-600" />
        <h3 className="font-semibold text-gray-900">
          Вывод за {monthLabel(month)}
        </h3>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">
        Индивидуальное занятие: выручка{' '}
        {fmtMoney2(result.individual.revenue)}, маржа{' '}
        <b>{fmtMoney2(result.individual.margin)}</b> (
        {fmtPercent(result.individual.marginPercent)}). Групповое занятие
        при наполняемости {result.group.clientsPerLesson} чел.: выручка{' '}
        {fmtMoney2(result.group.revenue)}, маржа{' '}
        <b>{fmtMoney2(result.group.margin)}</b> (
        {fmtPercent(result.group.marginPercent)}). Выгоднее{' '}
        <b>{better}</b> занятия — разрыв {diff} п.п.
      </p>
      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
        Юнит — одно проведённое занятие целиком. Выручка группового
        занятия складывается из оплат всех пришедших детей, а ставка
        педагога платится один раз независимо от их числа. Маржинальность
        — доля выручки, остающаяся после переменных расходов: зарплаты
        с взносами и отпускными и комиссии эквайринга. Постоянные расходы
        школы сюда не входят — они покрываются уже из этой маржи.
      </p>
    </div>
  );
}
