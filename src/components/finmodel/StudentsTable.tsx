import Icon from '@/components/ui/icon';
import { StudentsData, StudentsSource, fmMonthLabel } from '@/lib/finmodelApi';

interface Props {
  data: StudentsData;
}

const SOURCE: Record<StudentsSource, { label: string; cls: string }> = {
  alfa: { label: 'AlfaCRM', cls: 'bg-violet-50 text-violet-700' },
  report: { label: 'отчёт', cls: 'bg-blue-50 text-blue-700' },
  manual: { label: 'вручную', cls: 'bg-amber-50 text-amber-700' },
};

const num = (v: number | null | undefined, d = 0) =>
  v === null || v === undefined ? '—' : Number(v).toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Ученики и занятия по месяцам — справочно, в переменных расходах не участвуют. */
export default function StudentsTable({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Ученики и занятия</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Справочно, в расчёт переменных расходов не входит. Данные из CRM по всем педагогам, включая руководителя и
          РУО; тестовые ученики и диагностики не учитываются. Считаются только оплаченные места: пришёл или пропустил
          без уважительной причины (списание). Активные ученики — у кого за месяц было хотя бы одно такое место.
          Уроков на ученика = оплаченные места ÷ активные ученики. Наполняемость группы = оплаченные места на
          групповых ÷ число групповых занятий. Прошлый месяц фиксируется автоматически кнопкой
          «Закрыть месяц» — после закрытия данные не меняются.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Месяц</th>
              <th className="text-right px-4 py-2 font-medium">Активных учеников</th>
              <th className="text-right px-4 py-2 font-medium">Всего занятий</th>
              <th className="text-right px-4 py-2 font-medium">Уроков на ученика</th>
              <th className="text-right px-4 py-2 font-medium">Наполняемость группы</th>
              <th className="text-left px-4 py-2 font-medium">Источник</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.rows.map((r) => {
              const empty = r.active_students === null && r.total_lessons === null;
              const src = SOURCE[r.source];
              return (
                <tr key={r.month_id} className={r.state === 'current' ? 'text-gray-500' : ''}>
                  <td className="px-4 py-2 font-medium">
                    {fmMonthLabel(r.month_id)}
                    {r.state === 'current' && <span className="ml-2 text-xs font-normal text-gray-400">идёт</span>}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.active_students)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.total_lessons)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.avg_lessons_per_student, 2)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.avg_group_fill, 2)}</td>
                  <td className="px-4 py-2 text-xs whitespace-nowrap">
                    {!empty && <span className={`px-2 py-0.5 rounded ${src.cls}`}>{src.label}</span>}
                    {r.closed ? (
                      <Icon name="Lock" size={13} className="inline ml-2 text-gray-400" />
                    ) : (
                      r.state === 'open' && !r.report_complete && r.total_lessons !== null && (
                        <span className="ml-2 text-amber-600">отчёт снят до конца месяца</span>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}