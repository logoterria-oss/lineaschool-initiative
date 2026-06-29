import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { StudentRow, StudentVacation, saveVacation, deleteVacation } from '@/lib/studentsApi';
import { NameWithDot, fmtDate } from './studentsTableHelpers';

const MIN_DAYS = 8; // более 1 недели = 8+ дней

const daysDiff = (from: string, to: string) => {
  const a = new Date(from);
  const b = new Date(to);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
};

const VacationRow = ({
  v,
  onDelete,
}: {
  v: StudentVacation;
  onDelete: (id: number) => void;
}) => {
  const [deleting, setDeleting] = useState(false);
  const days = daysDiff(v.date_from, v.date_to);
  const today = new Date().toISOString().slice(0, 10);
  const active = v.date_to >= today;

  const handleDelete = async () => {
    if (!confirm('Удалить эту запись каникул?')) return;
    setDeleting(true);
    try {
      await deleteVacation(v.id);
      onDelete(v.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm ${active ? 'bg-amber-50' : 'bg-gray-50'}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-amber-400' : 'bg-gray-300'}`} />
      <span className="text-gray-700 whitespace-nowrap">
        {fmtDate(v.date_from)} — {fmtDate(v.date_to)}
      </span>
      <span className="text-xs text-gray-400">{days} дн.</span>
      {v.note && <span className="text-xs text-gray-500 flex-1 truncate">{v.note}</span>}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
        title="Удалить"
      >
        <Icon name="X" size={14} />
      </button>
    </div>
  );
};

const AddVacationForm = ({
  studentId,
  onAdded,
}: {
  studentId: number;
  onAdded: (v: StudentVacation) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!from || !to) { setError('Укажите обе даты'); return; }
    if (to <= from) { setError('Дата окончания должна быть позже начала'); return; }
    if (daysDiff(from, to) < MIN_DAYS) { setError('Приостановка должна быть более 1 недели'); return; }
    setSaving(true);
    try {
      await saveVacation(studentId, { date_from: from, date_to: to, note });
      // Создаём фейковый id для локального обновления, reload подтянет реальный
      onAdded({ id: Date.now(), date_from: from, date_to: to, note });
      setFrom(''); setTo(''); setNote(''); setOpen(false);
    } catch {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-purple-600 hover:underline inline-flex items-center gap-1 mt-1"
      >
        <Icon name="Plus" size={12} /> Добавить
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-8 text-xs w-36" />
        <span className="text-gray-400 text-xs">—</span>
        <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-8 text-xs w-36" />
        <Input placeholder="Примечание" value={note} onChange={e => setNote(e.target.value)} className="h-8 text-xs flex-1 min-w-24" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs">
          {saving ? '…' : 'Сохранить'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setOpen(false); setError(''); }} className="h-7 text-xs">
          Отмена
        </Button>
      </div>
    </div>
  );
};

const VacationsTable = ({ rows }: { rows: StudentRow[] }) => {
  const [vacMap, setVacMap] = useState<Record<number, StudentVacation[]>>(
    Object.fromEntries(rows.map(s => [s.id, s.vacations ?? []]))
  );

  const handleAdded = (studentId: number, v: StudentVacation) => {
    setVacMap(prev => ({ ...prev, [studentId]: [...(prev[studentId] ?? []), v] }));
  };

  const handleDeleted = (studentId: number, vacId: number) => {
    setVacMap(prev => ({
      ...prev,
      [studentId]: (prev[studentId] ?? []).filter(v => v.id !== vacId),
    }));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-left">
            <th className="px-3 py-3 font-semibold w-12">№</th>
            <th className="px-3 py-3 font-semibold">Фамилия Имя</th>
            <th className="px-3 py-3 font-semibold">Каникулы / Приостановка</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => {
            const vacs = vacMap[s.id] ?? [];
            return (
              <tr key={s.id} className="border-t border-gray-100 hover:bg-purple-50/50">
                <td className="px-3 py-3 text-gray-400 align-top">{i + 1}</td>
                <td className="px-3 py-3 font-medium text-gray-900 align-top whitespace-nowrap">
                  <NameWithDot name={s.name} statusId={s.status_id} statusName={s.status_name} />
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="space-y-1">
                    {vacs.map(v => (
                      <VacationRow key={v.id} v={v} onDelete={id => handleDeleted(s.id, id)} />
                    ))}
                    {vacs.length === 0 && (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </div>
                  <AddVacationForm studentId={s.id} onAdded={v => handleAdded(s.id, v)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default VacationsTable;
