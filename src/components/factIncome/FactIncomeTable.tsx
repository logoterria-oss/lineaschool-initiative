import { Fragment } from 'react';
import {
  FactRow,
  FactTotal,
  MARK_STYLE,
  countLabel,
  formatMoney,
  monthLabel,
  priceLabel,
} from '@/lib/factIncomeApi';

interface Props {
  rows: FactRow[];
  totals: FactTotal[];
  months: string[];
}

const FactIncomeTable = ({ rows, totals, months }: Props) => (
  <div className="overflow-auto border border-gray-200 rounded-xl bg-white">
    <table className="text-sm border-collapse">
      <thead>
        <tr className="bg-gray-50">
          <th className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200 px-2 py-2 text-left font-semibold w-10">
            №
          </th>
          <th className="sticky left-10 z-20 bg-gray-50 border-b border-r border-gray-200 px-3 py-2 text-left font-semibold min-w-[200px]">
            ФИ ученика
          </th>
          {months.map((m) => (
            <th
              key={m}
              colSpan={3}
              className="border-b border-r border-gray-200 px-2 py-2 text-center font-semibold capitalize"
            >
              {monthLabel(m)}
            </th>
          ))}
        </tr>
        <tr className="bg-gray-50 text-xs text-gray-500">
          <th className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200" />
          <th className="sticky left-10 z-20 bg-gray-50 border-b border-r border-gray-200" />
          {months.map((m) => (
            <Fragment key={m}>
              <th className="border-b border-gray-200 px-2 py-1 font-normal whitespace-nowrap">
                кол-во ур.
              </th>
              <th className="border-b border-gray-200 px-2 py-1 font-normal whitespace-nowrap">
                руб/урок
              </th>
              <th className="border-b border-r border-gray-200 px-2 py-1 font-normal whitespace-nowrap">
                стоимость
              </th>
            </Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.customer_id} className="hover:bg-gray-50/60">
            <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 px-2 py-1 text-gray-400 text-xs">
              {i + 1}
            </td>
            <td className="sticky left-10 z-10 bg-white border-b border-r border-gray-200 px-3 py-1 whitespace-nowrap font-medium">
              {row.name}
            </td>
            {row.cells.map((cell) => {
              const bg = MARK_STYLE[cell.mark];
              return (
                <Fragment key={cell.month}>
                  <td
                    className={`border-b border-gray-200 px-2 py-1 text-center tabular-nums ${bg}`}
                  >
                    {countLabel(cell)}
                  </td>
                  <td
                    className={`border-b border-gray-200 px-2 py-1 text-center tabular-nums text-gray-500 ${bg}`}
                  >
                    {priceLabel(cell)}
                  </td>
                  <td
                    className={`border-b border-r border-gray-200 px-2 py-1 text-right tabular-nums font-medium ${bg}`}
                  >
                    {formatMoney(cell.amount)}
                  </td>
                </Fragment>
              );
            })}
          </tr>
        ))}
      </tbody>
      <tfoot className="bg-gray-50 font-semibold">
        <tr>
          <td className="sticky left-0 z-10 bg-gray-50 border-t border-r border-gray-200" />
          <td className="sticky left-10 z-10 bg-gray-50 border-t border-r border-gray-200 px-3 py-2">
            ИТОГО
          </td>
          {totals.map((t) => (
            <td
              key={t.month}
              colSpan={3}
              className="border-t border-r border-gray-200 px-2 py-2 text-right tabular-nums text-green-700"
            >
              {formatMoney(t.total)} ₽
            </td>
          ))}
        </tr>
        <tr className="text-xs font-normal text-gray-600">
          <td className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200" />
          <td className="sticky left-10 z-10 bg-gray-50 border-r border-gray-200 px-3 py-1">
            учеников · новых · ушло
          </td>
          {totals.map((t) => (
            <td key={t.month} colSpan={3} className="border-r border-gray-200 px-2 py-1 text-right">
              {t.students} · <span className="text-green-700">+{t.new}</span> ·{' '}
              <span className="text-red-600">−{t.left}</span>
            </td>
          ))}
        </tr>
        <tr className="text-xs font-normal text-gray-600">
          <td className="sticky left-0 z-10 bg-gray-50 border-r border-b border-gray-200" />
          <td className="sticky left-10 z-10 bg-gray-50 border-r border-b border-gray-200 px-3 py-1">
            средний чек
          </td>
          {totals.map((t) => (
            <td
              key={t.month}
              colSpan={3}
              className="border-r border-b border-gray-200 px-2 py-1 text-right tabular-nums"
            >
              {formatMoney(t.avg_check)} ₽
            </td>
          ))}
        </tr>
      </tfoot>
    </table>
  </div>
);

export default FactIncomeTable;
