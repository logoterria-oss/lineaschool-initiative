import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  Staff,
  StaffRole,
  StaffStatus,
  ROLE_LABELS,
  STATUS_LABELS,
  listStaff,
  setStaffStatus,
  setStaffRole,
} from '@/lib/staffApi';

const STATUS_STYLE: Record<StaffStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

const ROLE_ORDER: StaffRole[] = ['teacher', 'diag', 'admin', 'head'];

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const normalized = iso.includes('+') || iso.endsWith('Z') ? iso : iso + 'Z';
  return new Date(normalized).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Moscow',
  });
};

const UsersView = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const list = await listStaff();
    setStaff(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const changeStatus = async (id: number, status: StaffStatus) => {
    setBusyId(id);
    const r = await setStaffStatus(id, status);
    if (r.ok) {
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    } else {
      alert(r.data?.message || 'Не удалось изменить статус');
    }
    setBusyId(null);
  };

  const changeRole = async (id: number, role: StaffRole) => {
    setBusyId(id);
    const r = await setStaffRole(id, role);
    if (r.ok) {
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, role } : s)));
    } else {
      alert(r.data?.message || 'Не удалось изменить роль');
    }
    setBusyId(null);
  };

  if (loading) {
    return <div className="text-gray-600 py-10 text-center">Загрузка...</div>;
  }

  const counts = {
    total: staff.length,
    pending: staff.filter((s) => s.status === 'pending').length,
    active: staff.filter((s) => s.status === 'active').length,
    blocked: staff.filter((s) => s.status === 'blocked').length,
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-gray-500">Всего: {counts.total}</span>
        {counts.pending > 0 && (
          <span className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
            Ожидают: {counts.pending}
          </span>
        )}
        <span className="text-green-700">Активны: {counts.active}</span>
        {counts.blocked > 0 && <span className="text-red-600">Заблокированы: {counts.blocked}</span>}
        <button
          onClick={load}
          className="ml-auto flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <Icon name="RefreshCw" size={14} />
          Обновить
        </button>
      </div>

      <div className="space-y-3">
        {staff.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
              {s.avatar_url ? (
                <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon name="User" size={18} className="text-amber-600" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 truncate">{s.full_name}</div>
              <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                <span>{s.phone}</span>
                <span>Регистрация: {formatDate(s.created_at)}</span>
              </div>
            </div>

            <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLE[s.status]}`}>
              {STATUS_LABELS[s.status]}
            </span>

            <select
              value={s.role}
              disabled={busyId === s.id}
              onChange={(e) => changeRole(s.id, e.target.value as StaffRole)}
              className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-60 flex-shrink-0"
            >
              {ROLE_ORDER.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>

            <div className="flex gap-2 flex-shrink-0">
              {s.status !== 'active' && (
                <button
                  onClick={() => changeStatus(s.id, 'active')}
                  disabled={busyId === s.id}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Icon name="Check" size={15} />
                  {s.status === 'pending' ? 'Подтвердить' : 'Разблокировать'}
                </button>
              )}
              {s.status !== 'blocked' && (
                <button
                  onClick={() => changeStatus(s.id, 'blocked')}
                  disabled={busyId === s.id}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-red-300 hover:text-red-600 disabled:opacity-60 text-gray-500 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Icon name="Ban" size={15} />
                  Заблокировать
                </button>
              )}
            </div>
          </div>
        ))}

        {staff.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Icon name="Users" size={36} className="mx-auto mb-3" />
            <p>Нет зарегистрированных пользователей</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersView;
