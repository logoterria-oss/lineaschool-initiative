import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SupervisionForm from './SupervisionForm';
import {
  Supervision,
  SupervisionInput,
  fetchSupervisions,
  updateSupervision,
  deleteSupervision,
} from '@/lib/supervisionsApi';
import { GROUP_TEACHERS, INDIVIDUAL_TEACHERS, maxTotalScore } from '@/lib/supervisionChecklist';

const ALL_TEACHERS = [...INDIVIDUAL_TEACHERS, ...GROUP_TEACHERS];

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}`;
};

const selectCls =
  'h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400';

const SupervisionsTable = () => {
  const [items, setItems] = useState<Supervision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teacherFilter, setTeacherFilter] = useState<number | ''>('');
  const [editing, setEditing] = useState<Supervision | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchSupervisions());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (teacherFilter ? items.filter((i) => i.teacher_id === teacherFilter) : items),
    [items, teacherFilter],
  );

  const handleUpdate = async (input: SupervisionInput) => {
    await updateSupervision(input);
    setEditing(null);
    await load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту супервизию?')) return;
    await deleteSupervision(id);
    await load();
  };

  if (loading) return <p className="text-gray-500">Загрузка…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-500">Педагог:</span>
        <select
          className={selectCls}
          value={teacherFilter}
          onChange={(e) => setTeacherFilter(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">Все</option>
          {ALL_TEACHERS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400 ml-auto">Всего: {filtered.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          Супервизий пока нет
        </div>
      ) : (
        <>
          {/* Десктоп */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="text-left font-semibold px-4 py-3 border-b border-gray-200">Дата супервизии</th>
                  <th className="text-left font-semibold px-4 py-3 border-b border-gray-200">Педагог</th>
                  <th className="text-left font-semibold px-4 py-3 border-b border-gray-200">Ученик</th>
                  <th className="text-left font-semibold px-4 py-3 border-b border-gray-200">Форма</th>
                  <th className="text-left font-semibold px-4 py-3 border-b border-gray-200">Дата урока</th>
                  <th className="text-left font-semibold px-4 py-3 border-b border-gray-200">Оценка</th>
                  <th className="px-4 py-3 border-b border-gray-200"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-4 py-3 text-gray-800">{fmtDate(s.supervision_date)}</td>
                    <td className="px-4 py-3 text-gray-800">{s.teacher_name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.student_name || '—'}
                      {s.student_age != null && (
                        <span className="text-gray-400"> · {s.student_age} лет</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.lesson_form === 'group' ? 'Групповое' : 'Индивидуальное'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(s.lesson_date)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      {s.total_score}{' '}
                      <span className="text-gray-400 font-normal">/ {maxTotalScore(s.lesson_form)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setEditing(s)}
                          className="text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Редактировать"
                        >
                          <Icon name="Pencil" size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Удалить"
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Мобильные */}
          <div className="md:hidden space-y-3">
            {filtered.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-900">{s.teacher_name}</div>
                    {s.student_name && (
                      <div className="text-sm text-gray-600">
                        Ученик: {s.student_name}
                        {s.student_age != null ? ` (${s.student_age})` : ''}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      {s.lesson_form === 'group' ? 'Групповое' : 'Индивидуальное'} · {fmtDate(s.supervision_date)}
                    </div>
                  </div>
                  <div className="text-right font-semibold text-emerald-700">
                    {s.total_score}
                    <span className="text-gray-400 font-normal text-xs"> / {maxTotalScore(s.lesson_form)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setEditing(s)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600"
                  >
                    <Icon name="Pencil" size={14} /> Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
                  >
                    <Icon name="Trash2" size={14} /> Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактирование супервизии</DialogTitle>
          </DialogHeader>
          {editing && (
            <SupervisionForm
              initial={editing}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
              submitLabel="Сохранить изменения"
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="flex justify-end">
        <Button variant="outline" onClick={load} className="text-sm">
          <Icon name="RefreshCw" size={14} className="mr-1" /> Обновить
        </Button>
      </div>
    </div>
  );
};

export default SupervisionsTable;