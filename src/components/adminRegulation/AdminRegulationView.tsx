import { Fragment, ReactNode } from 'react';
import Icon from '@/components/ui/icon';
import { ADMIN_REGULATION, RegBlock } from './data';

const URL_RE = /(https?:\/\/[^\s)»,]+)/g;

const linkify = (text: string): ReactNode[] =>
  text.split(URL_RE).map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 underline break-all hover:text-indigo-800"
      >
        {part}
      </a>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );

const withBreaks = (text: string) =>
  text.split('\n').map((line, i, arr) => (
    <Fragment key={i}>
      {linkify(line)}
      {i < arr.length - 1 && <br />}
    </Fragment>
  ));

const Blocks = ({ blocks }: { blocks: RegBlock[] }) => {
  const counters: number[] = [];
  return (
    <div className="space-y-2 text-[15px] leading-relaxed text-gray-700">
      {blocks.map((b, i) => {
        if (b.k !== 'li') counters.length = 0;
        if (b.k === 'table') {
          const [head, ...rows] = b.rows;
          return (
            <div key={i} className="overflow-x-auto my-3">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-indigo-50 text-gray-800">
                  <tr>
                    {head.map((c, j) => (
                      <th key={j} className="text-left font-semibold px-3 py-2 border-b border-gray-200">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, ri) => (
                    <tr key={ri} className="odd:bg-white even:bg-gray-50 align-top">
                      {r.map((c, j) => (
                        <td key={j} className={`px-3 py-2 border-b border-gray-100 ${j === 0 ? 'font-medium text-gray-900 whitespace-nowrap' : ''}`}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (b.k === 'h3') {
          return (
            <h4 key={i} className="font-semibold text-gray-900 pt-3">
              {withBreaks(b.text)}
            </h4>
          );
        }
        if (b.k === 'p') {
          const warn = /^(Внимание|Важно)/.test(b.text);
          return warn ? (
            <div key={i} className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-900">
              <Icon name="TriangleAlert" size={16} className="flex-shrink-0 mt-1 text-amber-600" />
              <p>{withBreaks(b.text)}</p>
            </div>
          ) : (
            <p key={i}>{withBreaks(b.text)}</p>
          );
        }
        counters.length = b.lvl + 1;
        counters[b.lvl] = (counters[b.lvl] || 0) + 1;
        const [head, ...rest] = b.text.split('\n');
        return (
          <div key={i} className="flex gap-2" style={{ paddingLeft: `${b.lvl * 1.25}rem` }}>
            <span className="flex-shrink-0 min-w-[1.25rem] text-indigo-500 font-semibold">
              {b.ordered ? `${counters[b.lvl]}.` : '•'}
            </span>
            <div>
              <span className={b.bold || rest.length ? 'font-semibold text-gray-900' : ''}>{linkify(head)}</span>
              {rest.length > 0 && <div>{withBreaks(rest.join('\n'))}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AdminRegulationView = () => (
  <div className="space-y-4">
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-xl font-bold text-gray-900">Регламент работы администратора</h2>
      <p className="text-sm text-gray-500 mt-1">онлайн-школы коррекции дислексии и дисграфии ЛинэяСкул</p>
    </div>

    {ADMIN_REGULATION.map((s, i) => (
      <details key={s.title} open={i === 0} className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer flex items-center gap-3 px-5 py-4 hover:bg-gray-50">
          <span className="font-semibold text-gray-900 flex-1">{s.title}</span>
          <Icon name="ChevronDown" size={20} className="text-gray-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-5 pb-5 pt-1 border-t border-gray-100">
          <Blocks blocks={s.blocks} />
        </div>
      </details>
    ))}
  </div>
);

export default AdminRegulationView;
