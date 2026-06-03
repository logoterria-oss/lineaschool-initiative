import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const ADMIN_PASSWORD = '426874';
const SESSION_KEY = 'admin_authenticated';

const roles = [
  {
    key: 'diag',
    label: 'Диагност',
    description: 'Заключения, анкеты, расписание, заявки',
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
    path: '/admin/manager',
  },
];

const RoleSelectPage = () => {
  const navigate = useNavigate();
  const [isAuth] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(isAuth);

  const handleLogin = () => {
    if (pin === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      sessionStorage.setItem('admin_password', pin);
      setAuthed(true);
      setError('');
    } else {
      setError('Неверный пароль');
      setPin('');
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-4">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Icon name="Lock" size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Вход в систему</h1>
          <p className="text-gray-500 text-sm">Введите пароль для доступа</p>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <input
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Пароль"
            autoFocus
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-green-400 bg-white shadow-sm"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
          >
            Войти
          </button>
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-4">
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
            <div>
              <div className="font-semibold text-gray-900 text-lg">{role.label}</div>
              <div className="text-sm text-gray-500">{role.description}</div>
            </div>
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