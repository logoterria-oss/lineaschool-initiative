import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { StudentRow, DiagnosticBubble } from '@/lib/studentsApi';
import { fmtDate } from './studentsTableHelpers';

const bubbleStyle = (type: DiagnosticBubble['type']) => {
  if (type === 'primary') return 'bg-sky-100 text-sky-700 border-sky-300';
  if (type === 'followup') return 'bg-green-100 text-green-700 border-green-300';
  return 'bg-gray-100 text-gray-500 border-gray-300 border-dashed';
};

const bubbleLabel = (type: DiagnosticBubble['type']) => {
  if (type === 'primary') return 'Первичная диагностика';
  if (type === 'followup') return 'Диагностика';
  return 'Запланирована';
};

const DiagnosticBubbleView = ({ d }: { d: DiagnosticBubble }) => {
  const [open, setOpen] = useState(false);
  const clickable = d.type !== 'planned';

  return (
  <div className="relative inline-block">
    <span
      onClick={() => clickable && setOpen((v) => !v)}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium whitespace-nowrap ${
        clickable ? 'cursor-pointer' : 'cursor-default'
      } ${bubbleStyle(d.type)}`}
    >
      {d.type === 'planned' && <Icon name="Clock" size={12} />}
      {fmtDate(d.date)}
    </span>

    {clickable && open && (
      <div className="absolute left-0 bottom-full mb-2 z-30 w-72 bg-white border border-gray-200 rounded-lg shadow-xl p-3 text-left">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 transition-colors"
          title="Закрыть"
        >
          <Icon name="X" size={16} />
        </button>
        <p className="text-xs font-semibold text-gray-900 mb-1 pr-5">
          {bubbleLabel(d.type)} · {fmtDate(d.date)}
        </p>

        {d.type === 'primary' ? (
          <div className="mb-2">
            {d.link ? (
              <a
                href={d.link}
                target="_blank"
                rel="noreferrer"
                className="text-purple-600 hover:underline inline-flex items-center gap-1 text-sm"
              >
                <Icon name="FileText" size={13} /> Открыть заключение
              </a>
            ) : (
              <span className="text-sm text-gray-400">Заключение не привязано</span>
            )}
          </div>
        ) : (
          <div className="mb-2">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">Прогресс</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{d.topic || '—'}</p>
          </div>
        )}

        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">
            Рекомендации педагогу
          </p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{d.note || '—'}</p>
        </div>
      </div>
    )}
  </div>
  );
};

const ProgressTable = ({ rows }: { rows: StudentRow[] }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-left">
            <th className="px-3 py-3 font-semibold w-12">№</th>
            <th className="px-3 py-3 font-semibold">Фамилия Имя</th>
            <th className="px-3 py-3 font-semibold">Диагностики</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => (
            <tr key={s.id} className="border-t border-gray-100 hover:bg-purple-50/50">
              <td className="px-3 py-3 text-gray-400 align-top">{i + 1}</td>
              <td className="px-3 py-3 font-medium text-gray-900 align-top whitespace-nowrap">
                {s.name}
              </td>
              <td className="px-3 py-3 align-top">
                {s.diagnostics && s.diagnostics.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {s.diagnostics.map((d, idx) => (
                      <DiagnosticBubbleView key={`${d.date}-${idx}`} d={d} />
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">Нет диагностик</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default ProgressTable;