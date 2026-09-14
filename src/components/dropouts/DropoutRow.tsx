import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dropout, dropoutDate, monthsText } from '@/lib/dropoutsApi';

interface Props {
  student: Dropout;
  onSave: (p: { refused_at: string | null; reason: string; conflicts: string }) => Promise<void>;
}

/** Строка таблицы бросивших: расчётные данные слева, заметки админа — правятся */
const DropoutRow = ({ student, onSave }: Props) => {
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refusedAt, setRefusedAt] = useState(student.refused_at || '');
  const [reason, setReason] = useState(student.reason);
  const [conflicts, setConflicts] = useState(student.conflicts);

  const save = async () => {
    setBusy(true);
    await onSave({ refused_at: refusedAt || null, reason, conflicts });
    setBusy(false);
    setEdit(false);
  };

  const cancel = () => {
    setRefusedAt(student.refused_at || '');
    setReason(student.reason);
    setConflicts(student.conflicts);
    setEdit(false);
  };

  return (
    <tr className="border-b border-gray-100 align-top hover:bg-gray-50/60">
      <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{student.name}</td>

      {/* Дата последнего урока приходит из CRM — только для чтения */}
      <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{dropoutDate(student.left_at)}</td>

      {/* Дата отказа — со слов родителя, вводит администратор */}
      <td className="px-3 py-3 whitespace-nowrap">
        {edit ? (
          <Input
            type="date"
            value={refusedAt}
            onChange={(e) => setRefusedAt(e.target.value)}
            className="h-8 w-[150px] text-xs"
          />
        ) : (
          <span className={student.refused_at ? 'text-gray-700' : 'text-gray-400'}>
            {student.refused_at ? dropoutDate(student.refused_at) : 'не указана'}
          </span>
        )}
      </td>

      <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{monthsText(student.months)}</td>

      <td className="px-3 py-3">
        {student.teachers.length === 0 ? (
          <span className="text-gray-400">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {student.teachers.map((t) => (
              <span
                key={t}
                className="bg-purple-50 text-purple-700 rounded-md px-1.5 py-0.5 text-[11px]"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </td>

      <td className="px-3 py-3 min-w-[220px]">
        {edit ? (
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Что сказал родитель"
            rows={3}
            className="text-xs bg-white"
          />
        ) : (
          <span className={student.reason ? 'text-gray-700' : 'text-gray-400'}>
            {student.reason || 'не указана'}
          </span>
        )}
      </td>

      <td className="px-3 py-3 min-w-[220px]">
        {edit ? (
          <Textarea
            value={conflicts}
            onChange={(e) => setConflicts(e.target.value)}
            placeholder="Конфликты, жалобы, проблемы"
            rows={3}
            className="text-xs bg-white"
          />
        ) : (
          <span className={student.conflicts ? 'text-amber-700' : 'text-gray-400'}>
            {student.conflicts || 'нет'}
          </span>
        )}
      </td>

      <td className="px-3 py-3 whitespace-nowrap">
        {edit ? (
          <div className="flex gap-1">
            <Button size="sm" onClick={save} disabled={busy} className="h-8 gap-1">
              <Icon name={busy ? 'Loader' : 'Check'} size={14} className={busy ? 'animate-spin' : ''} />
              Сохранить
            </Button>
            <Button size="sm" variant="outline" onClick={cancel} disabled={busy} className="h-8">
              Отмена
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setEdit(true)}
            className="text-gray-400 hover:text-purple-700 transition-colors"
            title="Заполнить причину и конфликты"
          >
            <Icon name="Pencil" size={16} />
          </button>
        )}
      </td>
    </tr>
  );
};

export default DropoutRow;