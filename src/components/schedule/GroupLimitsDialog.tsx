import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { GroupLimit, deleteGroupLimit, setGroupLimit } from '@/lib/bookingsApi';
import { GroupRow, MAX_GROUP_SIZE, WEEKDAY_SHORT, addDays, fmtDate } from './types';

interface Option {
  key: string;
  weekday: number;
  time: string;
  teacherId: number;
  teacherName: string;
  groupId: number | null;
  enrolled: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  rows: GroupRow[];
  limits: GroupLimit[];
  onChanged: () => void;
}

const ruDate = (iso: string) => iso.split('-').reverse().join('.');

/** Временно уменьшить число мест в группе — например, на 2 недели */
const GroupLimitsDialog = ({ open, onClose, rows, limits, onChanged }: Props) => {
  const { toast } = useToast();
  const today = fmtDate(new Date());

  const options = useMemo<Option[]>(() => {
    const list: Option[] = [];
    for (const r of rows) {
      for (const [day, cell] of Object.entries(r.cells)) {
        if (!cell) continue;
        list.push({
          key: `${day}|${r.time}|${r.teacher_id}|${r.group_id ?? ''}`,
          weekday: Number(day),
          time: r.time,
          teacherId: r.teacher_id,
          teacherName: r.teacher_name,
          groupId: r.group_id ?? null,
          enrolled: cell.student_ids.length,
        });
      }
    }
    return list.sort((a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time));
  }, [rows]);

  const [key, setKey] = useState('');
  const [maxSize, setMaxSize] = useState(MAX_GROUP_SIZE - 1);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(fmtDate(addDays(new Date(), 13)));
  const [saving, setSaving] = useState(false);

  const picked = options.find((o) => o.key === key) || null;
  const minSize = picked ? picked.enrolled : 0;

  useEffect(() => {
    if (!open) return;
    setDateFrom(today);
    setDateTo(fmtDate(addDays(new Date(), 13)));
  }, [open, today]);

  useEffect(() => {
    if (picked) setMaxSize(Math.max(picked.enrolled, Math.min(maxSize, MAX_GROUP_SIZE - 1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const label = (weekday: number, time: string, teacherId: number) => {
    const o = options.find((x) => x.weekday === weekday && x.time === time && x.teacherId === teacherId);
    return `${WEEKDAY_SHORT[weekday]} ${time}${o ? ` (${o.teacherName})` : ''}`;
  };

  const save = async () => {
    if (!picked) return;
    setSaving(true);
    const res = await setGroupLimit({
      weekday: picked.weekday,
      timeFrom: picked.time,
      teacherId: picked.teacherId,
      groupId: picked.groupId,
      maxSize,
      enrolled: picked.enrolled,
      dateFrom,
      dateTo,
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: 'Не сохранилось', description: res.error || 'Попробуйте ещё раз', variant: 'destructive' });
      return;
    }
    toast({ title: 'Ограничение сохранено' });
    setKey('');
    onChanged();
  };

  const remove = async (id: number) => {
    await deleteGroupLimit(id);
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ограничить количество мест</DialogTitle>
          <DialogDescription>
            На выбранный период в группе будет меньше свободных мест — родители по ссылке не смогут
            записаться сверх лимита.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Группа (по этой неделе)</label>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Выберите группу</option>
              {options.map((o) => (
                <option key={o.key} value={o.key}>
                  {WEEKDAY_SHORT[o.weekday]} {o.time} ({o.teacherName}) — учеников: {o.enrolled}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Мест в группе</label>
              <Input
                type="number"
                min={minSize}
                max={MAX_GROUP_SIZE}
                value={maxSize}
                onChange={(e) => setMaxSize(Number(e.target.value))}
                onBlur={() => setMaxSize((v) => Math.min(MAX_GROUP_SIZE, Math.max(minSize, v || 0)))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">С</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">По</label>
              <Input type="date" value={dateTo} min={dateFrom} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          {picked && (
            <p className="text-xs text-gray-500">
              Сейчас в группе {picked.enrolled} учен. — меньше нельзя. Свободных мест станет:{' '}
              <b>{Math.max(0, maxSize - picked.enrolled)}</b>.
            </p>
          )}

          <Button
            onClick={save}
            disabled={!picked || saving || maxSize < minSize || maxSize > MAX_GROUP_SIZE || !dateFrom || !dateTo}
            className="w-full gap-1.5"
          >
            {saving ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Check" size={15} />}
            Сохранить ограничение
          </Button>
        </div>

        {limits.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="text-sm font-semibold text-gray-800 mb-2">Действующие ограничения</div>
            <div className="space-y-1.5">
              {limits.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-700">
                    {label(l.weekday, l.timeFrom, l.teacherId)} — до {l.maxSize} мест,{' '}
                    {ruDate(l.dateFrom)}–{ruDate(l.dateTo)}
                  </span>
                  <button onClick={() => remove(l.id)} className="text-gray-400 hover:text-red-500" title="Снять ограничение">
                    <Icon name="X" size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GroupLimitsDialog;
