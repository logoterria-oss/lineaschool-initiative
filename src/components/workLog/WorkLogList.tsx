import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { WorkLogEntry, deleteWorkLog, formatMinutes, listWorkLog } from '@/lib/workLogApi';

interface Props {
  dateFrom: string;
  dateTo: string;
  /** Обновляется извне, чтобы перезагрузить список после новой записи */
  reloadKey?: number;
  onChanged?: () => void;
  /** Записи всех сотрудников — только для руководителя */
  allStaff?: boolean;
}

const fmtDate = (d: string) => {
  const p = (d || '').slice(0, 10).split('-');
  return p.length === 3 ? `${p[2]}.${p[1]}` : d;
};

const WorkLogList = ({ dateFrom, dateTo, reloadKey = 0, onChanged, allStaff }: Props) => {
  const { toast } = useToast();
  const [items, setItems] = useState<WorkLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const r = await listWorkLog({ date_from: dateFrom, date_to: dateTo, allStaff });
    setItems(r.items);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, reloadKey, allStaff]);

  const remove = async (e: WorkLogEntry) => {
    if (!confirm(`Удалить запись «${e.task_title}»?`)) return;
    const ok = await deleteWorkLog(e.id);
    if (ok) {
      setItems((prev) => prev.filter((x) => x.id !== e.id));
      onChanged?.();
    } else {
      toast({ title: 'Не удалось удалить', variant: 'destructive' });
    }
  };

  // Группируем по дате — так ближе к привычной табличке учёта
  const byDate: Record<string, WorkLogEntry[]> = {};
  items.forEach((e) => {
    const key = (e.log_date || '').slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(e);
  });
  const dates = Object.keys(byDate).sort().reverse();

  if (loading) return <div className="text-gray-500 py-10 text-center">Загрузка…</div>;

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Icon name="ClipboardList" size={34} className="mx-auto mb-2" />
        <p>За выбранный период записей нет</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dates.map((d) => {
        const rows = byDate[d];
        const total = rows.reduce((s, r) => s + (r.minutes || 0), 0);
        return (
          <div key={d} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="font-semibold text-sm text-gray-800">{fmtDate(d)}</span>
              <span className="text-xs text-gray-500">
                {rows.length} задач · {formatMinutes(total)}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {rows.map((e) => (
                <div key={e.id} className="flex items-start gap-3 px-4 py-2.5">
                  <span className="text-[11px] font-bold bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                    {e.task_code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-900">{e.task_title}</div>
                    {(e.subject || e.comment) && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {e.subject}
                        {e.subject && e.comment ? ' · ' : ''}
                        {e.comment}
                      </div>
                    )}
                    {allStaff && (
                      <div className="text-[11px] text-gray-400 mt-0.5">{e.staff_name}</div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 shrink-0 mt-0.5">
                    {formatMinutes(e.minutes)}
                  </span>
                  <button
                    onClick={() => remove(e)}
                    className="p-1 text-gray-300 hover:text-red-500 shrink-0"
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WorkLogList;