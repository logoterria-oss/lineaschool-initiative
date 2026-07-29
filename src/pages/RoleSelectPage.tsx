import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import {
  registerStaff,
  loginStaff,
  fetchMe,
  getStaffToken,
  ROLE_LABELS,
  StaffRole,
} from '@/lib/staffApi';
import EmailVerifyModal from '@/components/staffAuth/EmailVerifyModal';
import ForgotPasswordModal from '@/components/staffAuth/ForgotPasswordModal';

const ADMIN_PASSWORD = '426874';
const SESSION_KEY = 'admin_authenticated';

const roles = [
  {
    key: 'diag',
    label: 'Диагност',
    description: 'Заключения, анкеты, расписание, оплаты',
    icon: 'Stethoscope',
    color: 'border-green-300 hover:border-green-500',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    path: '/admin/diag',
  },
  {
    key: 'teacher',
    label: 'Педагог',
    description: 'График работы',
    icon: 'GraduationCap',
    color: 'border-blue-300 hover:border-blue-500',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    path: '/admin/teacher',
  },
  {
    key: 'admin',
    label: 'Администратор',
    description: 'Управление школой',
    icon: 'ShieldCheck',
    color: 'border-purple-300 hover:border-purple-500',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    path: '/admin/admin-workspace',
  },
  {
    key: 'head',
    label: 'Руководитель',
    description: 'Оплаты, отчёты, аналитика',
    icon: 'BarChart2',
    color: 'border-amber-300 hover:border-amber-500',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    path: '/admin/head',
  },
];

const REG_ROLES: StaffRole[] = ['teacher', 'diag', 'admin', 'head'];

const homePathForRole = (role: StaffRole): string => {
  switch (role) {
    case 'head': return '/admin/head-workspace';
    case 'diag': return '/admin/diag';
    case 'teacher': return '/admin/teacher-lk';
    case 'admin': return '/admin/admin-workspace';
    default: return '/admin/home';
  }
};

type Mode = 'personal' | 'shared' | 'register';

const RoleSelectPage = () => {
  const navigate = useNavigate();
  const [isAuth] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');
  const [authed, setAuthed] = useState(isAuth);

  const [mode, setMode] = useState<Mode>('personal');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [regRole, setRegRole] = useState<StaffRole>('teacher');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const [verifyData, setVerifyData] = useState<{ phone: string; crmEmail: string } | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [checkingSession, setCheckingSession] = useState(() => !!getStaffToken());

  // Автовход: если есть действующая сессия (токен живёт 30 дней) — сразу в кабинет.
  useEffect(() => {
    if (!getStaffToken()) return;
    (async () => {
      try {
        const staff = await fetchMe();
        if (staff) {
          sessionStorage.setItem(SESSION_KEY, 'true');
          sessionStorage.setItem('staff_role', staff.role);
          sessionStorage.setItem('staff_name', staff.full_name);
          navigate(homePathForRole(staff.role), { replace: true });
          return;
        }
      } catch {
        /* игнорируем — покажем форму входа */
      }
      setCheckingSession(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAuthed = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setAuthed(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('admin_password');
    sessionStorage.removeItem('staff_role');
    sessionStorage.removeItem('staff_name');
    localStorage.removeItem('staff_token');
    setAuthed(false);
    setMode('personal');
    setPhone('');
    setPassword('');
    setPin('');
  };

  const handleSharedLogin = () => {
    if (pin === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_password', pin);
      markAuthed();
      setError('');
    } else {
      setError('Неверный пароль');
      setPin('');
    }
  };

  const handlePersonalLogin = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const r = await loginStaff(phone, password);
      if (r.ok) {
        const staff = r.data.staff;
        sessionStorage.setItem('staff_role', staff.role);
        sessionStorage.setItem('staff_name', staff.full_name);
        navigate(homePathForRole(staff.role));
      } else {
        setError(r.data.message || 'Не удалось войти');
      }
    } catch {
      setError('Ошибка сети, попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const r = await registerStaff({ full_name: fullName, phone, password, role: regRole });
      if (r.ok) {
        setVerifyData({ phone, crmEmail: r.data.crm_email || '' });
      } else {
        setError(r.data.message || 'Не удалось зарегистрироваться');
      }
    } catch {
      setError('Ошибка сети, попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white shadow-sm';

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <Icon name="Loader2" size={28} className="text-green-600 animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-4 py-10">
        <div className="mb-6 text-center">
          <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Icon name="Lock" size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Вход в систему</h1>
          <p className="text-gray-500 text-sm">
            {mode === 'register' ? 'Регистрация сотрудника' : 'Личный вход по телефону'}
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3">
          {mode === 'personal' && (
            <>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                placeholder="Телефон, напр. +7 900 000-00-00"
                autoFocus
                className={inputCls}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handlePersonalLogin()}
                placeholder="Пароль"
                className={inputCls}
              />
              <button
                onClick={handlePersonalLogin}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
              >
                {loading ? 'Вхожу…' : 'Войти'}
              </button>
              <button
                onClick={() => { setShowForgot(true); setError(''); setInfo(''); }}
                className="w-full text-gray-500 hover:text-gray-700 text-sm py-1"
              >
                Забыли пароль?
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); setInfo(''); }}
                className="w-full text-green-700 hover:text-green-800 text-sm font-medium py-1"
              >
                Регистрация нового сотрудника
              </button>
            </>
          )}

          {mode === 'register' && (
            <>
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setError(''); }}
                placeholder="ФИО"
                autoFocus
                className={inputCls}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                placeholder="Телефон"
                className={inputCls}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Пароль (мин. 6 символов)"
                className={inputCls}
              />
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as StaffRole)}
                className={inputCls}
              >
                {REG_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
              >
                {loading ? 'Отправляю…' : 'Зарегистрироваться'}
              </button>
              <button
                onClick={() => { setMode('personal'); setError(''); }}
                className="w-full text-gray-500 hover:text-gray-700 text-sm py-1"
              >
                Назад ко входу
              </button>
            </>
          )}

          {mode === 'shared' && (
            <>
              <input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSharedLogin()}
                placeholder="Общий пароль"
                autoFocus
                className={`${inputCls} text-center tracking-widest`}
              />
              <button
                onClick={handleSharedLogin}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
              >
                Войти
              </button>
              <button
                onClick={() => { setMode('personal'); setError(''); }}
                className="w-full text-gray-500 hover:text-gray-700 text-sm py-1"
              >
                Личный вход по телефону
              </button>
            </>
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {info && <p className="text-green-600 text-sm text-center">{info}</p>}

          {mode !== 'shared' && mode !== 'register' && (
            <button
              onClick={() => { setMode('shared'); setError(''); setInfo(''); }}
              className="w-full text-gray-400 hover:text-gray-600 text-xs py-1"
            >
              Войти по общему паролю
            </button>
          )}
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-8 text-gray-400 hover:text-gray-600 flex items-center gap-2 text-sm transition-colors"
        >
          <Icon name="ArrowLeft" size={15} />
          На главную
        </button>

        {verifyData && (
          <EmailVerifyModal
            phone={verifyData.phone}
            crmEmail={verifyData.crmEmail}
            onClose={() => setVerifyData(null)}
            onVerified={() => {
              setVerifyData(null);
              setMode('personal');
              setPassword('');
              setInfo('Email подтверждён. Теперь войдите по телефону и паролю.');
            }}
          />
        )}
        {showForgot && (
          <ForgotPasswordModal
            initialPhone={phone}
            onClose={() => setShowForgot(false)}
            onDone={() => {
              setShowForgot(false);
              setMode('personal');
              setPassword('');
              setInfo('Пароль обновлён. Войдите с новым паролем.');
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={handleLogout}
          title="Выйти"
          className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 shadow-sm transition-all duration-200"
        >
          <Icon name="LogOut" size={20} />
          <span className="text-sm font-medium pr-1">Выйти</span>
        </button>
        <button
          onClick={() => navigate('/admin/settings')}
          title="Настройки"
          className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-400 shadow-sm transition-all duration-200"
        >
          <Icon name="Settings" size={20} />
        </button>
      </div>

      <div className="mb-8 text-center">
        <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Icon name="Settings" size={28} className="text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Вход в систему</h1>
        <p className="text-gray-500">Выберите вашу роль</p>
      </div>

      <div className="grid gap-4 w-full max-w-sm">
        {roles.map((role) => (
          <button
            key={role.key}
            onClick={() => navigate(role.path)}
            className={`flex items-center gap-4 w-full bg-white rounded-xl border-2 ${role.color} p-5 text-left shadow-sm hover:shadow-md transition-all duration-200`}
          >
            <div className={`p-3 rounded-lg ${role.iconBg} flex-shrink-0`}>
              <Icon name={role.icon as 'Settings'} size={24} className={role.iconColor} />
            </div>
            <div className="font-semibold text-gray-900 text-lg">{role.label}</div>
            <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto flex-shrink-0" />
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate('/')}
        className="mt-8 text-gray-400 hover:text-gray-600 flex items-center gap-2 text-sm transition-colors"
      >
        <Icon name="ArrowLeft" size={15} />
        На главную
      </button>
    </div>
  );
};

export default RoleSelectPage;