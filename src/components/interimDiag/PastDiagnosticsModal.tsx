import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { ImpairedProcessKey, ProcessLevel } from './impairedProcesses';
import { API, EMPTY, PastEntry } from './pastDiagnostics';
import PastDiagnosticsModeChoice from './PastDiagnosticsModeChoice';
import PastDiagnosticsTable from './PastDiagnosticsTable';
import PastDiagnosticsForm from './PastDiagnosticsForm';

export type { PastEntry };

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
  // null — экран выбора действия; 'edit' — правка существующих; 'add' — внесение новой
  const [mode, setMode] = useState<'edit' | 'add' | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`${API}?name=${encodeURIComponent(studentName)}`)
      .then((r) => r.json())
      .then((d) => setItems(d?.success ? d.items || [] : []))
      .catch(() => setError('Не удалось загрузить прошлые диагностики'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [studentName]);

  // В режиме правки сразу открываем первую запись целиком,
  // чтобы все поля были доступны без лишних кликов
  useEffect(() => {
    if (mode === 'edit' && editingId === null && items.length > 0) {
      startEdit(items[0]);
    }
  }, [mode, items, editingId]);

  const patch = (p: Partial<Omit<PastEntry, 'id'>>) => setDraft((prev) => ({ ...prev, ...p }));

  const startEdit = (it: PastEntry) => {
    setEditingId(it.id);
    setSavedAt(null);
    setError('');
    setDraft({
      diagType: it.diagType,
      date: it.date || '',
      readingSpeed: it.readingSpeed,
      readingComprehension: it.readingComprehension,
      dysgraphicErrors: it.dysgraphicErrors,
      dysorthographicErrors: it.dysorthographicErrors,
      totalErrors: it.totalErrors,
      readingChar: it.readingChar,
      readingErrorTypes: it.readingErrorTypes || [],
      errorTypes: it.errorTypes || [],
      orthoErrorTypes: it.orthoErrorTypes || [],
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
      // После добавления возвращаемся к списку, после правки — остаёмся в записи
      if (!editingId) {
        resetDraft();
        setMode('edit');
      } else {
        setSavedAt(Date.now());
      }
      load();
      onSaved();
    } catch {
      setError('Ошибка сохранения. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    const ok = confirm(
      'Убрать эту диагностику из истории ребёнка?\n\n' +
        'Заключение исчезнет из списков и цепочки динамики, но сохранится в корзине — ' +
        'руководитель школы сможет его вернуть.',
    );
    if (!ok) return;
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        id,
        who: sessionStorage.getItem('staff_name') || '',
      }),
    });
    if (editingId === id) resetDraft();
    load();
    onSaved();
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

        {mode === null && (
          <PastDiagnosticsModeChoice
            loading={loading}
            itemsCount={items.length}
            onEdit={() => {
              resetDraft();
              setMode('edit');
            }}
            onAdd={() => {
              resetDraft();
              setMode('add');
            }}
          />
        )}

        {mode !== null && (
          <div className="p-5">
            <button
              type="button"
              onClick={() => {
                resetDraft();
                setMode(null);
              }}
              className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
            >
              <Icon name="ArrowLeft" size={14} />
              Назад к выбору
            </button>

            {mode === 'add' ? null : loading ? (
              <p className="text-sm text-gray-500">Загрузка…</p>
            ) : items.length === 0 ? (
              <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                Прошлых диагностик пока нет. Добавьте их ниже, если они проводились раньше.
              </p>
            ) : (
              <PastDiagnosticsTable
                items={items}
                editingId={editingId}
                onEdit={startEdit}
                onRemove={remove}
              />
            )}

            {mode === 'edit' && items.length > 1 && (
              <p className="mt-4 text-sm text-gray-500">
                Ниже открыта выделенная диагностика. Чтобы править другую — нажмите карандаш в её
                строке.
              </p>
            )}

            {(mode === 'add' || editingId) && (
              <PastDiagnosticsForm
                draft={draft}
                editingId={editingId}
                saving={saving}
                error={error}
                savedAt={savedAt}
                patch={patch}
                setLevel={setLevel}
                onSave={save}
              />
            )}
          </div>
        )}

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