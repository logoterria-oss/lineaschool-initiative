import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { READING_CHAR_LEVELS } from './readingWriting';
import {
  IMPAIRED_GROUPS,
  ImpairedProcessKey,
  ProcessLevel,
  ProcessLevelsState,
  PROCESS_LEVELS,
} from './impairedProcesses';

const API = 'https://functions.poehali.dev/12cd04f4-07fb-4fe5-a260-e3c9955e0ae7';

export interface PastEntry {
  id: number;
  diagType: 'primary' | 'interim';
  date: string | null;
  readingSpeed: string;
  readingComprehension: string;
  dysgraphicErrors: string;
  dysorthographicErrors: string;
  totalErrors: string;
  readingChar: string;
  levels: ProcessLevelsState;
}

const EMPTY: Omit<PastEntry, 'id'> = {
  diagType: 'interim',
  date: '',
  readingSpeed: '',
  readingComprehension: '',
  dysgraphicErrors: '',
  dysorthographicErrors: '',
  totalErrors: '',
  readingChar: '',
  levels: {},
};

interface Props {
  studentName: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function PastDiagnosticsModal({ studentName, onClose, onSaved }: Props) {
  const [items, setItems] = useState<PastEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Omit<PastEntry, 'id'>>({ ...EMPTY });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    fetch(`${API}?name=${encodeURIComponent(studentName)}`)
      .then((r) => r.json())
      .then((d) => setItems(d?.success ? d.items || [] : []))
      .catch(() => setError('Не удалось загрузить прошлые диагностики'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [studentName]);

  const patch = (p: Partial<Omit<PastEntry, 'id'>>) => setDraft((prev) => ({ ...prev, ...p }));

  const startEdit = (it: PastEntry) => {
    setEditingId(it.id);
    setDraft({
      diagType: it.diagType,
      date: it.date || '',
      readingSpeed: it.readingSpeed,
      readingComprehension: it.readingComprehension,
      dysgraphicErrors: it.dysgraphicErrors,
      dysorthographicErrors: it.dysorthographicErrors,
      totalErrors: it.totalErrors,
      readingChar: it.readingChar,
      levels: it.levels || {},
    });
  };

  const setLevel = (key: ImpairedProcessKey, level: ProcessLevel | null) =>
    setDraft((prev) => {
      const next = { ...prev.levels };
      if (level) next[key] = level;
      else delete next[key];
      return { ...prev, levels: next };
    });

  const resetDraft = () => {
    setEditingId(null);
    setDraft({ ...EMPTY });
  };

  const save = async () => {
    if (!draft.date) {
      setError('Укажите дату диагностики');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingId ? 'update' : 'create',
          id: editingId,
          name: studentName,
          ...draft,
        }),
      });
      const d = await res.json();
      if (!d?.success) {
        setError(d?.error || 'Не удалось сохранить');
        return;
      }
      resetDraft();
      load();
      onSaved();
    } catch {
      setError('Ошибка сохранения. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Удалить эту запись прошлой диагностики?')) return;
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    if (editingId === id) resetDraft();
    load();
    onSaved();
  };

  const fmt = (d: string | null) => {
    if (!d) return '—';
    const p = d.split('-');
    return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : d;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-3xl rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 p-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Результаты прошлых диагностик</h3>
            <p className="mt-1 text-sm text-gray-500">
              {studentName}. Здесь можно вручную внести первичную и промежуточные диагностики, если
              они проводились не в этой форме. Замеры встают в цепочку динамики показателей.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <p className="text-sm text-gray-500">Загрузка…</p>
          ) : items.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
              Прошлых диагностик пока нет. Добавьте их ниже, если они проводились раньше.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500">
                    <th className="pb-2 pr-3">Тип</th>
                    <th className="pb-2 pr-3">Дата</th>
                    <th className="pb-2 pr-3">Скорость</th>
                    <th className="pb-2 pr-3">Понимание</th>
                    <th className="pb-2 pr-3">Дисграф.</th>
                    <th className="pb-2 pr-3">Орфогр.</th>
                    <th className="pb-2 pr-3">Всего</th>
                    <th className="pb-2 pr-3">Процессы</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-t border-gray-100">
                      <td className="py-2 pr-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            it.diagType === 'primary'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {it.diagType === 'primary' ? 'Первичная' : 'Промежуточная'}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-medium text-gray-900">{fmt(it.date)}</td>
                      <td className="py-2 pr-3">{it.readingSpeed || '—'}</td>
                      <td className="py-2 pr-3">{it.readingComprehension || '—'}</td>
                      <td className="py-2 pr-3">{it.dysgraphicErrors || '—'}</td>
                      <td className="py-2 pr-3">{it.dysorthographicErrors || '—'}</td>
                      <td className="py-2 pr-3">{it.totalErrors || '—'}</td>
                      <td className="py-2 pr-3 text-gray-600">
                        {Object.keys(it.levels || {}).length || '—'}
                      </td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => startEdit(it)}
                          className="mr-2 text-gray-400 hover:text-primary"
                          title="Изменить"
                        >
                          <Icon name="Pencil" size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(it.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Удалить"
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 rounded-lg border border-gray-200 p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">
              {editingId ? 'Изменение записи' : 'Добавить прошлую диагностику'}
            </h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-sm">Тип диагностики</Label>
                <Select
                  value={draft.diagType}
                  onValueChange={(v) => patch({ diagType: v as 'primary' | 'interim' })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Первичная</SelectItem>
                    <SelectItem value="interim">Промежуточная</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Дата диагностики</Label>
                <Input
                  type="date"
                  value={draft.date || ''}
                  onChange={(e) => patch({ date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-3">
                <h5 className="text-sm font-semibold text-gray-900">Чтение и письмо</h5>
              </div>
              <div>
                <Label className="text-sm">Скорость чтения (сл/мин)</Label>
                <Input
                  type="number"
                  min="0"
                  value={draft.readingSpeed}
                  onChange={(e) => patch({ readingSpeed: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Понимание прочитанного (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={draft.readingComprehension}
                  onChange={(e) => patch({ readingComprehension: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Дисграфических ошибок</Label>
                <Input
                  type="number"
                  min="0"
                  value={draft.dysgraphicErrors}
                  onChange={(e) => patch({ dysgraphicErrors: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Орфографических ошибок</Label>
                <Input
                  type="number"
                  min="0"
                  value={draft.dysorthographicErrors}
                  onChange={(e) => patch({ dysorthographicErrors: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Ошибок всего</Label>
                <Input
                  type="number"
                  min="0"
                  value={draft.totalErrors}
                  onChange={(e) => patch({ totalErrors: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-3">
                <Label className="text-sm">Характер чтения</Label>
                <Select
                  value={draft.readingChar || undefined}
                  onValueChange={(v) => patch({ readingChar: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Не указан" />
                  </SelectTrigger>
                  <SelectContent>
                    {READING_CHAR_LEVELS.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <h5 className="text-sm font-semibold text-gray-900">Нарушенные процессы</h5>
              <p className="mt-1 text-xs text-gray-500">
                Укажите уровень по тем процессам, которые оценивались. Незаполненные не попадут в
                цепочку динамики.
              </p>

              <div className="mt-4 space-y-5">
                {IMPAIRED_GROUPS.map((group, idx) => (
                  <div key={group.title}>
                    <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                      {idx + 1}) {group.title}
                    </p>
                    <div className="space-y-3">
                      {group.items.map((item) => (
                        <div
                          key={item.key}
                          className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2"
                        >
                          <Label className="text-sm font-normal text-gray-700">{item.label}</Label>
                          <Select
                            value={draft.levels[item.key] || 'none'}
                            onValueChange={(v) =>
                              setLevel(item.key, v === 'none' ? null : (v as ProcessLevel))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Не оценивался" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Не оценивался</SelectItem>
                              {PROCESS_LEVELS.map((lvl) => (
                                <SelectItem key={lvl} value={lvl}>
                                  {lvl === 'норма' ? 'норма!' : lvl}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetDraft}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Отмена
                </button>
              )}
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Сохранение…' : editingId ? 'Сохранить изменения' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}