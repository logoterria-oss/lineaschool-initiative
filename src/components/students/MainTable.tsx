import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { StudentRow } from '@/lib/studentsApi';
import { NameWithDot, ageLabel } from './studentsTableHelpers';

const AgeCell = ({
  s,
  onSave,
}: {
  s: StudentRow;
  onSave: (id: number, age: number | null) => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(s.age != null ? String(s.age) : '');
  const [saving, setSaving] = useState(false);

  const start = () => {
    setValue(s.age != null ? String(s.age) : '');
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const trimmed = value.trim();
      await onSave(s.id, trimmed === '' ? null : Number(trimmed));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <td className="px-3 py-3 align-top">
        <Input
          type="number"
          min={1}
          max={120}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 w-20 text-sm"
          placeholder="Лет"
        />
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? '…' : 'ОК'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
            Отмена
          </Button>
        </div>
      </td>
    );
  }

  return (
    <td className="px-3 py-3 text-gray-700 whitespace-nowrap align-top group">
      <div className="flex items-center gap-2">
        <span>
          {s.age ? ageLabel(s.age) : '—'}
          {s.age_manual && (
            <span className="ml-1 text-[10px] text-purple-500 align-middle">(вручную)</span>
          )}
        </span>
        <button
          onClick={start}
          title="Редактировать возраст"
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 transition-opacity"
        >
          <Icon name="Pencil" size={14} />
        </button>
      </div>
    </td>
  );
};

const ConclusionCell = ({
  s,
  onSave,
}: {
  s: StudentRow;
  onSave: (id: number, value: string) => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(s.conclusion);
  const [saving, setSaving] = useState(false);

  const start = () => {
    setValue(s.conclusion);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(s.id, value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <td className="px-3 py-3 align-top">
        <Textarea
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="text-sm"
          placeholder="Формы нарушений чтения и письма"
        />
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
            Отмена
          </Button>
        </div>
      </td>
    );
  }

  return (
    <td className="px-3 py-3 text-gray-700 align-top group">
      <div className="flex items-start gap-2">
        <span className="flex-1">
          {s.conclusion || '—'}
          {s.conclusion_manual && (
            <span className="ml-1 text-[10px] text-purple-500 align-middle">(вручную)</span>
          )}
        </span>
        <button
          onClick={start}
          title="Редактировать"
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 transition-opacity flex-shrink-0"
        >
          <Icon name="Pencil" size={14} />
        </button>
      </div>
    </td>
  );
};

const MainTable = ({
  rows,
  onSaveConclusion,
  onSaveAge,
}: {
  rows: StudentRow[];
  onSaveConclusion: (id: number, value: string) => Promise<void>;
  onSaveAge: (id: number, age: number | null) => Promise<void>;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-left">
            <th className="px-3 py-3 font-semibold w-12">№</th>
            <th className="px-3 py-3 font-semibold">Фамилия Имя</th>
            <th className="px-3 py-3 font-semibold">Возраст</th>
            <th className="px-3 py-3 font-semibold">Формы нарушений чтения и письма</th>
            <th className="px-3 py-3 font-semibold">Абонемент</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => (
            <tr key={s.id} className="border-t border-gray-100 hover:bg-purple-50/50">
              <td className="px-3 py-3 text-gray-400 align-top">{i + 1}</td>
              <td className="px-3 py-3 align-top font-medium text-gray-900">
                <NameWithDot name={s.name} statusId={s.status_id} statusName={s.status_name} />
              </td>
              <AgeCell s={s} onSave={onSaveAge} />
              <ConclusionCell s={s} onSave={onSaveConclusion} />
              <td className="px-3 py-3 align-top">
                {s.tariff ? (
                  <div className="flex flex-col">
                    <span className="text-gray-800">{s.tariff.name}</span>
                    <span
                      className={`text-xs ${s.tariff.is_active ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {s.tariff.is_active ? 'актуален' : 'закончен'}
                      {s.tariff.shared_with_siblings && (
                        <span className="text-purple-500"> · разделён между сиблингами</span>
                      )}
                    </span>
                  </div>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default MainTable;