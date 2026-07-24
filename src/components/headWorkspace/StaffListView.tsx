import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  Staff,
  StaffRole,
  StaffInput,
  ROLE_LABELS,
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  importStaffFromCrm,
} from '@/lib/staffApi';

const ROLE_ORDER: StaffRole[] = ['teacher', 'diag', 'admin', 'head'];

const emptyForm: StaffInput = { full_name: '', job_title: '', phone: '', email: '', role: 'teacher' };

const StaffListView = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<StaffInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setStaff(await listStaff());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startAdd = () => {
    setForm(emptyForm);
    setEditId('new');
  };

  const startEdit = (s: Staff) => {
    setForm({
      full_name: s.full_name,
      job_title: s.job_title || '',
      phone: s.phone || '',
      email: s.email || '',
      role: s.role,
    });
    setEditId(s.id);
  };

  const save = async () => {
    if (!form.full_name?.trim()) {
      toast({ title: 'Укажите ФИО', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const r = editId === 'new' ? await createStaff(form) : await updateStaff(editId as number, form);
    setSaving(false);
    if (r.ok) {
      toast({ title: editId === 'new' ? 'Сотрудник добавлен' : 'Изменения сохранены' });
      setEditId(null);
      load();
    } else {
      toast({ title: r.data?.message || 'Не удалось сохранить', variant: 'destructive' });
    }
  };

  const remove = async (s: Staff) => {
    if (!confirm(`Удалить сотрудника «${s.full_name}»?`)) return;
    const r = await deleteStaff(s.id);
    if (r.ok) {
      setStaff((prev) => prev.filter((x) => x.id !== s.id));
      toast({ title: 'Сотрудник удалён' });
    } else {
      toast({ title: r.data?.message || 'Не удалось удалить', variant: 'destructive' });
    }
  };

  const importCrm = async () => {
    setImporting(true);
    const r = await importStaffFromCrm();
    setImporting(false);
    if (r.ok) {
      toast({ title: `Импорт из CRM: добавлено ${r.data.added}, обновлено ${r.data.updated}` });
      load();
    } else {
      toast({ title: r.data?.message || 'Не удалось выгрузить из CRM', variant: 'destructive' });
    }
  };

  const filtered = staff.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      (s.job_title || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q)
    );
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, должности, телефону"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-amber-400"
          />
        </div>
        {!readOnly && (
          <>
            <button
              onClick={importCrm}
              disabled={importing}
              className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-amber-300 disabled:opacity-60 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Icon name={importing ? 'Loader' : 'Download'} size={15} className={importing ? 'animate-spin' : ''} />
              Выгрузить из CRM
            </button>
            <button
              onClick={startAdd}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Icon name="Plus" size={16} />
              Добавить
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div className="text-gray-500 py-10 text-center">Загрузка…</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">ФИО</th>
                <th className="px-4 py-3 font-medium">Должность</th>
                <th className="px-4 py-3 font-medium">Телефон</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Роль</th>
                {!readOnly && <th className="px-4 py-3 font-medium w-24"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{s.full_name}</span>
                      {s.source === 'crm' && (
                        <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">CRM</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.job_title || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{ROLE_LABELS[s.role]}</td>
                  {!readOnly && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => startEdit(s)} className="p-1.5 text-gray-400 hover:text-amber-600" title="Редактировать">
                          <Icon name="Pencil" size={15} />
                        </button>
                        <button onClick={() => remove(s)} className="p-1.5 text-gray-400 hover:text-red-600" title="Удалить">
                          <Icon name="Trash2" size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={readOnly ? 5 : 6} className="text-center py-12 text-gray-400">
                    <Icon name="Users" size={32} className="mx-auto mb-2" />
                    {search
                      ? 'Никто не найден'
                      : readOnly
                      ? 'Список сотрудников пуст'
                      : 'Список пуст — добавьте сотрудника или выгрузите из CRM'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-gray-900">
                {editId === 'new' ? 'Новый сотрудник' : 'Редактирование'}
              </h3>
              <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-700">
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <Field label="ФИО" value={form.full_name || ''} onChange={(v) => setForm({ ...form, full_name: v })} placeholder="Иванова Мария Петровна" />
              <Field label="Должность" value={form.job_title || ''} onChange={(v) => setForm({ ...form, job_title: v })} placeholder="Педагог по чтению" />
              <Field label="Телефон" value={form.phone || ''} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+7 900 000-00-00" />
              <Field label="Email" value={form.email || ''} onChange={(v) => setForm({ ...form, email: v })} placeholder="name@mail.ru" />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Роль</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-amber-400"
                >
                  {ROLE_ORDER.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={() => setEditId(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Отмена
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                {saving && <Icon name="Loader" size={15} className="animate-spin" />}
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div>
    <label className="text-xs text-gray-500 mb-1 block">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
    />
  </div>
);

export default StaffListView;