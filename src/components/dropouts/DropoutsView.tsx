import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import DropoutRow from './DropoutRow';
import { Dropout, fetchDropouts, saveDropoutNote, syncDropouts } from '@/lib/dropoutsApi';

/** Ученики, которые перестали заниматься: причины ухода и последние педагоги */
const DropoutsView = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Dropout[]>([]);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { students, syncedAt: at } = await fetchDropouts();
    setRows(students);
    setSyncedAt(at);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    setSyncing(true);
    const ok = await syncDropouts();
    setSyncing(false);
    if (!ok) {
      toast({ title: 'Не удалось обновить данные', variant: 'destructive' });
      return;
    }
    await load();
    toast({ title: 'Список обновлён' });
  };

  const handleSave = async (
    s: Dropout,
    p: { refused_at: string | null; reason: string; conflicts: string },
  ) => {
    const ok = await saveDropoutNote({ student_id: s.id, student_name: s.name, ...p });
    if (!ok) {
      toast({ title: 'Не удалось сохранить', variant: 'destructive' });
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === s.id ? { ...r, ...p } : r)));
    toast({ title: 'Сохранено', description: s.name });
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.teachers.some((t) => t.toLowerCase().includes(q)),
    );
  }, [rows, query]);

  /* Заполненность причин — по ней видно, сколько работы осталось */
  const filled = rows.filter((r) => r.reason.trim()).length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Бросившие</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Всего {rows.length} · причина указана у {filled}
            {syncedAt && ` · данные на ${new Date(syncedAt).toLocaleString('ru-RU', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по ученику, педагогу, причине"
            className="h-9 w-[260px]"
          />
          <Button variant="outline" onClick={refresh} disabled={syncing} className="gap-2 h-9">
            <Icon
              name={syncing ? 'Loader' : 'RefreshCw'}
              size={16}
              className={syncing ? 'animate-spin' : ''}
            />
            {syncing ? 'Обновляю…' : 'Обновить из CRM'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-10 justify-center">
          <Icon name="Loader" size={18} className="animate-spin" />
          Загружаю список
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-10">
          {rows.length === 0 ? 'Бросивших учеников нет' : 'Никого не нашлось'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2.5 font-semibold">ФИО</th>
                <th className="px-3 py-2.5 font-semibold">Дата последнего урока</th>
                <th className="px-3 py-2.5 font-semibold">Дата отказа</th>
                <th className="px-3 py-2.5 font-semibold">Занимался</th>
                <th className="px-3 py-2.5 font-semibold">Педагоги (2 мес)</th>
                <th className="px-3 py-2.5 font-semibold">Причина отказа</th>
                <th className="px-3 py-2.5 font-semibold">Конфликты / проблемы</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <DropoutRow key={s.id} student={s} onSave={(p) => handleSave(s, p)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DropoutsView;