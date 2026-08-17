import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { AdminShift, KIND_META, ShiftAdmin, ShiftKind } from '@/lib/adminShiftsApi';

const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 22) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });

interface Props {
  date: string;
  admins: ShiftAdmin[];
  shifts: AdminShift[];
  onSave: (p: { staff_id: number; date: string; time_from: string; time_to: string; kind: ShiftKind; note: string }) => void;
  onDelete: (staffId: number, date: string) => void;
  onClose: () => void;
}

/** Окно редактирования смен на конкретный день */
const ShiftEditor = ({ date, admins, shifts, onSave, onDelete, onClose }: Props) => {
  const [staffId, setStaffId] = useState<number>(admins[0]?.id || 0);
  const [kind, setKind] = useState<ShiftKind>('work');
  const [from, setFrom] = useState('09:00');
  const [to, setTo] = useState('18:00');
  const [note, setNote] = useState('');

  const dayShifts = shifts.filter((s) => s.shift_date.slice(0, 10) === date);

  const submit = () => {
    if (!staffId) return;
    onSave({ staff_id: staffId, date, time_from: from, time_to: to, kind, note });
    setNote('');
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="font-semibold text-gray-900 first-letter:uppercase">{fmtDate(date)}</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {dayShifts.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase">В этот день</div>
              {dayShifts.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-2 border rounded-xl px-3 py-2 text-sm ${KIND_META[s.kind].cls}`}
                >
                  <span className="font-medium truncate">{s.staff_name}</span>
                  <span className="ml-auto whitespace-nowrap">
                    {s.kind === 'work' ? `${s.time_from}–${s.time_to}` : KIND_META[s.kind].label}
                  </span>
                  <button
                    onClick={() => onDelete(s.staff_id, date)}
                    className="text-current opacity-50 hover:opacity-100"
                    title="Убрать"
                  >
                    <Icon name="Trash2" size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 pt-1">
            <div className="text-xs font-medium text-gray-500 uppercase">Добавить или изменить</div>

            <select
              value={staffId}
              onChange={(e) => setStaffId(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            >
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name}
                  {a.job_title ? ` — ${a.job_title}` : ''}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(KIND_META) as ShiftKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    kind === k ? KIND_META[k].cls : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {KIND_META[k].label}
                </button>
              ))}
            </div>

            {kind === 'work' && (
              <div className="flex items-center gap-2">
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <span className="text-gray-400">–</span>
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}

            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Комментарий (необязательно)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />

            <Button onClick={submit} className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl">
              Сохранить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftEditor;
