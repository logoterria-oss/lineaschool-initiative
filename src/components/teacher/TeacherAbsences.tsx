import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import {
  Absence,
  AbsenceKind,
  fetchAbsences,
  addAbsence,
  deleteAbsence,
} from '@/lib/teacherAbsencesApi';

const TIME_OPTIONS: string[] = [];
for (let h = 8; h <= 21; h++) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

interface FormState {
  kind: AbsenceKind;
  dateFrom: string;
  dateTo: string;
  wholeDay: boolean;
  timeFrom: string;
  timeTo: string;
  substitute: string;
}

const emptyForm = (kind: AbsenceKind): FormState => ({
  kind,
  dateFrom: '',
  dateTo: '',
  wholeDay: true,
  timeFrom: '09:00',
  timeTo: '10:00',
  substitute: '',
});

const TeacherAbsences = ({ teacherId }: { teacherId: number }) => {
  const [items, setItems] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await fetchAbsences(teacherId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [teacherId]);

  const submit = async () => {
    if (!form) return;
    if (!form.dateFrom) { setError('Укажите дату'); return; }
    if (form.kind === 'vacation' && !form.dateTo) { setError('Укажите дату окончания отпуска'); return; }
    setSaving(true);
    setError('');
    try {
      await addAbsence({
        teacher_id: teacherId,
        kind: form.kind,
        date_from: form.dateFrom,
        date_to: form.kind === 'vacation' ? form.dateTo : form.dateFrom,
        time_from: form.kind === 'dayoff' && !form.wholeDay ? form.timeFrom : null,
        time_to: form.kind === 'dayoff' && !form.wholeDay ? form.timeTo : null,
        substitute_name: form.kind === 'vacation' ? form.substitute.trim() : '',
      });
      setForm(null);
      await load();
    } catch {
      setError('Не удалось сохранить. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    await deleteAbsence(id);
  };

  const dayoffs = items.filter((i) => i.kind === 'dayoff');
  const vacations = items.filter((i) => i.kind === 'vacation');

  return (
    <div className="mt-8">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Выходные и отпуск
      </h3>

      {/* Кнопки добавления */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => { setForm(emptyForm('dayoff')); setError(''); }}
          className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-400 text-gray-800 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Icon name="CalendarMinus" size={16} className="text-blue-600" />
          Добавить выходной
        </button>
        <button
          onClick={() => { setForm(emptyForm('vacation')); setError(''); }}
          className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-amber-400 text-gray-800 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Icon name="Palmtree" size={16} className="text-amber-600" />
          Добавить отпуск
        </button>
      </div>

      {/* Форма добавления */}
      {form && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <Icon
              name={form.kind === 'dayoff' ? 'CalendarMinus' : 'Palmtree'}
              size={18}
              className={form.kind === 'dayoff' ? 'text-blue-600' : 'text-amber-600'}
            />
            <span className="font-semibold text-gray-900">
              {form.kind === 'dayoff' ? 'Новый выходной' : 'Новый отпуск'}
            </span>
          </div>

          {form.kind === 'dayoff' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Дата</label>
                <input
                  type="date"
                  value={form.dateFrom}
                  onChange={(e) => setForm({ ...form, dateFrom: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.wholeDay}
                  onChange={(e) => setForm({ ...form, wholeDay: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                Весь день
              </label>
              {!form.wholeDay && (
                <div className="flex items-end gap-2">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">С</label>
                    <select
                      value={form.timeFrom}
                      onChange={(e) => setForm({ ...form, timeFrom: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">До</label>
                    <select
                      value={form.timeTo}
                      onChange={(e) => setForm({ ...form, timeTo: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">С даты</label>
                <input
                  type="date"
                  value={form.dateFrom}
                  onChange={(e) => setForm({ ...form, dateFrom: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">По дату</label>
                <input
                  type="date"
                  value={form.dateTo}
                  onChange={(e) => setForm({ ...form, dateTo: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="w-full">
                <label className="text-xs text-gray-500 block mb-1">
                  Кто заменяет (необязательно)
                </label>
                <input
                  type="text"
                  value={form.substitute}
                  onChange={(e) => setForm({ ...form, substitute: e.target.value })}
                  placeholder="Например: Ирина Зинченко"
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Если указать замену, окна педагога останутся доступны для записи
                </p>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button onClick={submit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Сохраняю…' : 'Добавить'}
            </Button>
            <button
              onClick={() => setForm(null)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список */}
      {loading ? (
        <p className="text-sm text-gray-400">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Выходные и отпуск не добавлены</p>
      ) : (
        <div className="space-y-4">
          {dayoffs.length > 0 && (
            <div className="space-y-2">
              {dayoffs.map((a) => (
                <div key={a.id} className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                  <Icon name="CalendarMinus" size={16} className="text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-800">
                    Выходной {fmtDate(a.date_from)}
                    {a.time_from && a.time_to ? (
                      <span className="text-gray-500"> · {a.time_from}–{a.time_to}</span>
                    ) : (
                      <span className="text-gray-500"> · весь день</span>
                    )}
                  </span>
                  <button
                    onClick={() => remove(a.id)}
                    className="ml-auto p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {vacations.length > 0 && (
            <div className="space-y-2">
              {vacations.map((a) => (
                <div key={a.id} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                  <Icon name="Palmtree" size={16} className="text-amber-600 flex-shrink-0" />
                  <span className="text-sm text-gray-800">
                    Отпуск {fmtDate(a.date_from)} — {fmtDate(a.date_to)}
                    {a.substitute_name && (
                      <span className="text-amber-700"> · заменяет {a.substitute_name}</span>
                    )}
                  </span>
                  <button
                    onClick={() => remove(a.id)}
                    className="ml-auto p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherAbsences;