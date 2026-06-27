import Icon from '@/components/ui/icon';
import { StudentRow } from '@/lib/studentsApi';
import { fmtDate } from './studentsTableHelpers';

const ProgressTable = ({ rows }: { rows: StudentRow[] }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-left">
            <th className="px-3 py-3 font-semibold">Фамилия Имя</th>
            <th className="px-3 py-3 font-semibold">Последняя диагностика</th>
            <th className="px-3 py-3 font-semibold">Следующая (ориентир)</th>
            <th className="px-3 py-3 font-semibold">Заключение</th>
            <th className="px-3 py-3 font-semibold">Рекомендации</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-t border-gray-100 hover:bg-purple-50/50">
              <td className="px-3 py-3 font-medium text-gray-900 align-top">{s.name}</td>
              <td className="px-3 py-3 text-gray-700 whitespace-nowrap align-top">
                {fmtDate(s.last_diagnostic)}
              </td>
              <td className="px-3 py-3 text-gray-700 whitespace-nowrap align-top">
                {fmtDate(s.next_diagnostic)}
              </td>
              <td className="px-3 py-3 align-top">
                {s.report_link ? (
                  <a
                    href={s.report_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Icon name="FileText" size={13} /> Открыть
                  </a>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-3 py-3 text-gray-600 align-top whitespace-pre-line max-w-md">
                {s.recommendations || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default ProgressTable;
