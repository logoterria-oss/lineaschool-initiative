import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  DiagCoverage,
  DiagSlot,
  addDiagSlots,
  deleteDiagSlot,
  fetchDiagAdminSlots,
  notifyDiagSlotsChanged,
} from '@/lib/diagBookingApi';

interface TimeRow {
  from: string;
  to: string;
}

/** «10:00» + 60 минут → «11:00» */
const plusHour = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h)) return '';
  return `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
};

const tomorrowIso = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

/** Руководитель заводит окна для диагностик на конкретные даты */
const DiagSlotsDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<DiagSlot[]>([]);
  const [coverage, setCoverage] = useState<DiagCoverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(tomorrowIso());
  const [rows, setRows] = useState<TimeRow[]>([{ from: '10:00', to: '11:00' }]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchDiagAdminSlots();
    setSlots(data.slots);
    setCoverage(data.coverage);
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const byDay = useMemo(() => {
    const map = new Map<string, DiagSlot[]>();
    slots.forEach((s) => map.set(s.date, [...(map.get(s.date) || []), s]));
    return [...map.entries()];
  }, [slots]);

  const setRow = (i: number, patch: Partial<TimeRow>) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const save = async () => {
    const times = rows.filter((r) => r.from && r.to);
    if (!date || times.length === 0) return;
    setSaving(true);
    const res = await addDiagSlots(date, times);
    setSaving(false);
    if (!res.ok) {
      toast({ title: 'Не сохранилось', description: res.error || 'Попробуйте ещё раз', variant: 'destructive' });
      return;
    }
    toast({ title: `Добавлено окон: ${res.added ?? 0}` });
    const last = times[times.length - 1];
    setRows([{ from: last.to, to: plusHour(last.to) }]);
    notifyDiagSlotsChanged();
    load();
  };

  const remove = async (s: DiagSlot) => {
    const res = await deleteDiagSlot(s.id);
    if (!res.ok) {
      toast({ title: 'Нельзя удалить', description: res.error, variant: 'destructive' });
      return;
    }
    notifyDiagSlotsChanged();
    load();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Окна для диагностик</DialogTitle>
          <DialogDescription>
            Окна не повторяются: заводите их на конкретные даты, на 2 недели вперёд. Время — по Москве.
          </DialogDescription>
        </DialogHeader>

        {coverage && !coverage.enough && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800 flex gap-2">
            <Icon name="TriangleAlert" size={16} className="shrink-0 mt-0.5" />
            Окон на ближайшие 2 недели не хватает
            {coverage.lastSlotDateRu ? ` — последнее заведено на ${coverage.lastSlotDateRu}` : ''}.
          </div>
        )}

        <div className="border border-gray-200 rounded-xl p-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Дата</label>
            <Input type="date" value={date} min={tomorrowIso()} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">Время</label>
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="time"
                  value={r.from}
                  onChange={(e) => setRow(i, { from: e.target.value, to: plusHour(e.target.value) })}
                />
                <span className="text-gray-400">—</span>
                <Input type="time" value={r.to} onChange={(e) => setRow(i, { to: e.target.value })} />
                <button
                  onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                  disabled={rows.length === 1}
                  className="text-gray-300 hover:text-red-500 disabled:opacity-30 p-1"
                  title="Убрать"
                >
                  <Icon name="X" size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const last = rows[rows.length - 1];
                setRows([...rows, { from: last?.to || '10:00', to: plusHour(last?.to || '10:00') }]);
              }}
              className="text-sm text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <Icon name="Plus" size={14} />
              Ещё время в этот день
            </button>
          </div>
          <Button onClick={save} disabled={saving} className="w-full gap-1.5">
            {saving ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Check" size={15} />}
            Добавить окна
          </Button>
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-800 mb-2">Заведённые окна</div>
          {loading ? (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Icon name="Loader2" size={15} className="animate-spin" />
              Загружаем…
            </div>
          ) : byDay.length === 0 ? (
            <div className="text-sm text-gray-400">Окон пока нет</div>
          ) : (
            <div className="space-y-2">
              {byDay.map(([d, list]) => (
                <div key={d}>
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    {list[0].weekdayName}, {list[0].dateRu}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((s) => (
                      <span
                        key={s.id}
                        title={s.bookingId ? `Записан: ${s.childName || ''}` : 'Свободно'}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${
                          s.bookingId
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}
                      >
                        {s.timeFrom}–{s.timeTo}
                        {s.bookingId ? (
                          <span className="font-medium truncate max-w-[110px]">· {s.childName}</span>
                        ) : (
                          <button onClick={() => remove(s)} className="text-gray-300 hover:text-red-500">
                            <Icon name="X" size={12} />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiagSlotsDialog;
