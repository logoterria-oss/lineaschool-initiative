import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Calendar } from '@/components/ui/calendar';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import DayTimesEditor, { TimeRow } from './DayTimesEditor';
import {
  DiagCoverage,
  DiagSlot,
  addDiagSlots,
  deleteDiagSlot,
  fetchDiagAdminSlots,
  notifyDiagSlotsChanged,
} from '@/lib/diagBookingApi';

const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const ruDay = (d: Date) => d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

const DEFAULT_TIMES: TimeRow[] = [{ from: '10:00', to: '12:00' }];

/** Руководитель заводит окна для диагностик на конкретные даты */
const DiagSlotsDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<DiagSlot[]>([]);
  const [coverage, setCoverage] = useState<DiagCoverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState<Date[]>([]);
  // У каждого дня свой набор времён: ключ — дата YYYY-MM-DD
  const [times, setTimes] = useState<Record<string, TimeRow[]>>({});
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

  const sortedDates = useMemo(() => [...dates].sort((a, b) => a.getTime() - b.getTime()), [dates]);
  const timesOf = (d: Date) => times[isoOf(d)] || DEFAULT_TIMES;
  const setTimesOf = (d: Date, rows: TimeRow[]) => setTimes((prev) => ({ ...prev, [isoOf(d)]: rows }));
  const removeDay = (d: Date) => setDates((prev) => prev.filter((x) => isoOf(x) !== isoOf(d)));
  const total = sortedDates.reduce((n, d) => n + timesOf(d).filter((r) => r.from && r.to).length, 0);

  const save = async () => {
    const days = sortedDates
      .map((d) => ({ date: isoOf(d), times: timesOf(d).filter((r) => r.from && r.to) }))
      .filter((d) => d.times.length > 0);
    if (days.length === 0) return;
    setSaving(true);
    const res = await addDiagSlots(days);
    setSaving(false);
    if (!res.ok) {
      toast({ title: 'Не сохранилось', description: res.error || 'Попробуйте ещё раз', variant: 'destructive' });
      return;
    }
    toast({ title: `Добавлено окон: ${res.added ?? 0}` });
    setDates([]);
    setTimes({});
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
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Отметьте в календаре все дни, в которые нужны окна
            </label>
            <div className="flex justify-center border border-gray-100 rounded-lg">
              <Calendar
                mode="multiple"
                selected={dates}
                onSelect={(v) => setDates(v || [])}
                disabled={{ before: startOfToday() }}
                locale={ru}
                weekStartsOn={1}
                numberOfMonths={1}
              />
            </div>
          </div>

          {sortedDates.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600">Время для каждого дня</label>
                <button
                  onClick={() => {
                    setDates([]);
                    setTimes({});
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  сбросить все дни
                </button>
              </div>
              {sortedDates.map((d, i) => (
                <DayTimesEditor
                  key={isoOf(d)}
                  title={ruDay(d)}
                  rows={timesOf(d)}
                  onChange={(rows) => setTimesOf(d, rows)}
                  onRemoveDay={() => removeDay(d)}
                  onCopyPrev={i > 0 ? () => setTimesOf(d, timesOf(sortedDates[i - 1]).map((r) => ({ ...r }))) : undefined}
                />
              ))}
            </div>
          )}

          <Button onClick={save} disabled={saving || total === 0} className="w-full gap-1.5">
            {saving ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Check" size={15} />}
            {sortedDates.length === 0 ? 'Отметьте дни в календаре' : `Добавить окна: ${total}`}
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
