import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import {
  fetchMe,
  changePassword,
  logoutStaff,
  Staff,
  ROLE_LABELS,
} from '@/lib/staffApi';

const StaffProfilePage = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const staff = await fetchMe();
      setMe(staff);
      setLoading(false);
    })();
  }, []);

  const onChangePassword = async () => {
    setMsg('');
    setErr('');
    setSaving(true);
    try {
      const r = await changePassword(oldPassword, newPassword);
      if (r.ok) {
        setMsg('Пароль изменён');
        setOldPassword('');
        setNewPassword('');
      } else {
        setErr(r.data.message || 'Не удалось сменить пароль');
      }
    } catch {
      setErr('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    await logoutStaff();
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('staff_role');
    sessionStorage.removeItem('staff_name');
    navigate('/admin');
  };

  const inputCls =
    'w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white shadow-sm';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 flex items-center gap-2 text-sm mb-4"
        >
          <Icon name="ArrowLeft" size={15} />
          Назад
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Личный кабинет</h1>

        {loading ? (
          <p className="text-gray-500">Загрузка…</p>
        ) : !me ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-gray-600 mb-4">
              Вы не вошли под личным аккаунтом. Войдите по телефону, чтобы видеть профиль.
            </p>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium"
            >
              Ко входу
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">ФИО</div>
                <div className="font-semibold text-gray-900">{me.full_name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Телефон</div>
                <div className="text-gray-700">{me.phone}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Роль</div>
                <div className="text-gray-700">{ROLE_LABELS[me.role]}</div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-gray-900">Смена пароля</h2>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Текущий пароль"
                className={inputCls}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Новый пароль (мин. 6 символов)"
                className={inputCls}
              />
              {msg && <p className="text-green-600 text-sm">{msg}</p>}
              {err && <p className="text-red-500 text-sm">{err}</p>}
              <button
                onClick={onChangePassword}
                disabled={saving}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {saving ? 'Сохраняю…' : 'Сменить пароль'}
              </button>
            </div>

            <button
              onClick={onLogout}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="LogOut" size={18} />
              Выйти
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffProfilePage;
