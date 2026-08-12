import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { WorkLogStats as Stats, fetchWorkLogStats, formatMinutes } from '@/lib/workLogApi';
import { ROLE_LABELS, StaffRole } from '@/lib/staffApi';

interface Props {
  dateFrom: string;
  dateTo: string;
  reloadKey?: number;
}

/** Стрелка и подпись изменения к прошлому периоду */
function Delta({ now, prev, label }: { now: number; prev: number; label: string }) {
  if (!prev) {
    return <span className="text-xs text-gray-400">нет данных за прошлый период</span>;
  }
  const percent = Math.round(Math.abs((now - prev) / prev) * 100);
  if (percent === 0) return <span className="text-xs text-gray-500">без изменений</span>;
  const up = now > prev;
  return (
    <span className={`text-xs font-medium flex items-center gap-0.5 ${up ? 'text-green-600' : 'text-gray-500'}`}>
      <Icon name={up ? 'ArrowUp' : 'ArrowDown'} size={12} />
      {percent}% к прошлому периоду · было {label}
    </span>
  );
}

const WorkLogStatsView = ({ dateFrom, dateTo, reloadKey = 0 }: Props) => {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchWorkLogStats({ date_from: dateFrom, date_to: dateTo })
      .then(setData)
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, reloadKey]);

  if (loading) return <div className="text-gray-500 py-10 text-center">Загрузка…</div>;
  if (!data || data.total_tasks === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Icon name="BarChart2" size={34} className="mx-auto mb-2" />
        <p>За выбранный период данных нет</p>
      </div>
    );
  }

  const maxTask = Math.max(...data.by_task.map((t) => t.tasks), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Всего задач</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{data.total_tasks}</div>
          <Delta now={data.total_tasks} prev={data.prev_tasks} label={String(data.prev_tasks)} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Рабочее время</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatMinutes(data.total_minutes)}
          </div>
          <Delta
            now={data.total_minutes}
            prev={data.prev_minutes}
            label={formatMinutes(data.prev_minutes)}
          />
        </div>
      </div>

      {data.can_see_all && data.by_staff.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            По сотрудникам
          </h3>
          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-2.5 font-medium">Сотрудник</th>
                  <th className="px-4 py-2.5 font-medium">Роль</th>
                  <th className="px-4 py-2.5 font-medium text-right">Задач</th>
                  <th className="px-4 py-2.5 font-medium text-right">Время</th>
                </tr>
              </thead>
              <tbody>
                {data.by_staff.map((s) => (
                  <tr key={s.staff_id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{s.staff_name}</td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {ROLE_LABELS[s.staff_role as StaffRole] || s.staff_role}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-800">{s.tasks}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {formatMinutes(s.minutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          По типам задач
        </h3>
        <div className="space-y-1.5">
          {data.by_task.map((t) => (
            <div key={t.task_code} className="bg-white border border-gray-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 shrink-0">
                  {t.task_code}
                </span>
                <span className="text-sm text-gray-800 flex-1 min-w-0 truncate">{t.task_title}</span>
                <span className="text-sm font-semibold text-gray-900 shrink-0">{t.tasks}</span>
                <span className="text-xs text-gray-500 shrink-0 w-20 text-right">
                  {formatMinutes(t.minutes)}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${Math.round((t.tasks / maxTask) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkLogStatsView;
