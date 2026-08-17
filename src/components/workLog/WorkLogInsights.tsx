import { WorkLogStats, formatMinutes } from '@/lib/workLogApi';
import { HEAD_TASK_CATEGORIES } from './headTasks';
import { TASK_CATEGORIES } from './tasks';

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  [...HEAD_TASK_CATEGORIES, ...TASK_CATEGORIES].map((c) => [c.id, c.label]),
);

const catLabel = (id: string) => CATEGORY_LABEL[id] || 'Другое';

const weekLabel = (iso: string) => {
  const d = new Date(iso);
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const f = (x: Date) =>
    `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}`;
  return `${f(d)}–${f(end)}`;
};

interface Props {
  data: WorkLogStats;
  /** Показывать время (у администратора учитываются только задачи) */
  withTime: boolean;
}

/** Аналитика по выполненным задачам: направления, недели, объекты работы */
export default function WorkLogInsights({ data, withTime }: Props) {
  const val = (x: { tasks: number; minutes: number }) => (withTime ? x.minutes : x.tasks);
  const show = (x: { tasks: number; minutes: number }) =>
    withTime ? formatMinutes(x.minutes) : `${x.tasks}`;

  const cats = (data.by_category || []).slice().sort((a, b) => val(b) - val(a));
  const catTotal = cats.reduce((s, c) => s + val(c), 0) || 1;
  const weeks = data.by_week || [];
  const maxWeek = Math.max(...weeks.map(val), 1);
  const subjects = data.by_subject || [];
  const days = data.active_days || 0;

  const weekCats = data.by_week_category || [];
  const catsInWeeks = Array.from(new Set(weekCats.map((w) => w.category)));

  return (
    <div className="space-y-6">
      {days > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">Рабочих дней с задачами</div>
            <div className="text-xl font-bold text-gray-900">{days}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">В среднем за день</div>
            <div className="text-xl font-bold text-gray-900">
              {withTime
                ? formatMinutes(Math.round(data.total_minutes / days))
                : `${(data.total_tasks / days).toFixed(1)} задач`}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">Больше всего уходит на</div>
            <div className="text-sm font-semibold text-gray-900 leading-snug">
              {cats[0] ? `${catLabel(cats[0].category)} · ${show(cats[0])}` : '—'}
            </div>
          </div>
        </div>
      )}

      {cats.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {withTime ? 'На что уходит время' : 'Направления работы'}
          </h3>
          <div className="space-y-1.5">
            {cats.map((c) => {
              const percent = Math.round((val(c) / catTotal) * 100);
              return (
                <div key={c.category} className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm text-gray-800 flex-1 min-w-0 truncate">
                      {catLabel(c.category)}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{show(c)}</span>
                    <span className="text-xs text-gray-500 w-10 text-right">{percent}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {weeks.length > 1 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            По неделям
          </h3>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-end gap-2 h-32">
              {weeks.map((w) => (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span className="text-[10px] text-gray-500">{show(w)}</span>
                  <div
                    className="w-full bg-amber-400 rounded-t"
                    style={{ height: `${Math.max(4, Math.round((val(w) / maxWeek) * 100))}%` }}
                  />
                  <span className="text-[10px] text-gray-400 truncate w-full text-center">
                    {weekLabel(w.week)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {weeks.length > 1 && catsInWeeks.length > 1 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            По неделям и направлениям
          </h3>
          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-3 py-2 font-medium">Направление</th>
                  {weeks.map((w) => (
                    <th key={w.week} className="px-3 py-2 font-medium text-right whitespace-nowrap">
                      {weekLabel(w.week)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {catsInWeeks.map((cat) => (
                  <tr key={cat} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-2 text-gray-900">{catLabel(cat)}</td>
                    {weeks.map((w) => {
                      const cell = weekCats.find((x) => x.week === w.week && x.category === cat);
                      return (
                        <td key={w.week} className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">
                          {cell ? show(cell) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subjects.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            С кем и по чему больше всего работы
          </h3>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50">
            {subjects.map((s) => (
              <div key={s.subject} className="flex items-center gap-3 px-4 py-2">
                <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">{s.subject}</span>
                <span className="text-sm text-gray-800">{s.tasks} задач</span>
                {withTime && (
                  <span className="text-xs text-gray-500 w-20 text-right">
                    {formatMinutes(s.minutes)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
