import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import {
  listStaff,
  setStaffStatus,
  setStaffRole,
  Staff,
  StaffRole,
  StaffStatus,
  ROLE_LABELS,
  STATUS_LABELS,
  getStaffToken,
} from '@/lib/staffApi';

const ROLE_OPTIONS: StaffRole[] = ['teacher', 'diag', 'admin', 'head'];

const statusStyle: Record<StaffStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

const StaffManagePage = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (!getStaffToken()) {
        setError('Раздел доступен только руководителю после личного входа по телефону.');
        setRows([]);
        return;
      }
      const data = await listStaff();
      setRows(data);
    } catch {
      setError('Не удалось загрузить список сотрудников');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onStatus = async (id: number, status: StaffStatus) => {
    await setStaffStatus(id, status);
    load();
  };

  const onRole = async (id: number, role: StaffRole) => {
    await setStaffRole(id, role);
    load();
  };

  const pending = rows.filter((r) => r.status === 'pending');
  const others = rows.filter((r) => r.status !== 'pending');

  const renderRow = (s: Staff) => (
    <div
      key={s.id}
      className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900">{s.full_name}</div>
        <div className="text-sm text-gray-500">{s.phone}</div>
      </div>

      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle[s.status]}`}>
        {STATUS_LABELS[s.status]}
      </span>

      <select
        value={s.role}
        onChange={(e) => onRole(s.id, e.target.value as StaffRole)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
      >
        {ROLE_OPTIONS.map((r) => (
          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
        ))}
      </select>

      <div className="flex gap-2">
        {s.status !== 'active' && (
          <button
            onClick={() => onStatus(s.id, 'active')}
            className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium"
          >
            Подтвердить
          </button>
        )}
        {s.status !== 'blocked' && (
          <button
            onClick={() => onStatus(s.id, 'blocked')}
            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium"
          >
            Заблокировать
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/admin/head')}
          className="text-gray-400 hover:text-gray-600 flex items-center gap-2 text-sm mb-4"
        >
          <Icon name="ArrowLeft" size={15} />
          Назад
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Сотрудники</h1>
        <p className="text-gray-500 text-sm mb-6">
          Подтверждайте заявки на регистрацию, назначайте роли и блокируйте доступ.
        </p>

        {loading ? (
          <p className="text-gray-500">Загрузка…</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                  <Icon name="Clock" size={16} />
                  Ожидают подтверждения ({pending.length})
                </h2>
                <div className="space-y-2">{pending.map(renderRow)}</div>
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-2">
                Все сотрудники ({others.length})
              </h2>
              {others.length === 0 ? (
                <p className="text-gray-400 text-sm">Пока никого нет.</p>
              ) : (
                <div className="space-y-2">{others.map(renderRow)}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManagePage;
