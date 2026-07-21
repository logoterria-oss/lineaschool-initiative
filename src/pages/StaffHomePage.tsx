import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { fetchMe, logoutStaff, Staff, StaffRole, ROLE_LABELS } from '@/lib/staffApi';

const ROLE_DASH: Record<StaffRole, { path: string; icon: string; label: string }> = {
  diag: { path: '/admin/diag', icon: 'Stethoscope', label: 'Кабинет диагноста' },
  teacher: { path: '/admin/teacher', icon: 'GraduationCap', label: 'Кабинет педагога' },
  admin: { path: '/admin/manager', icon: 'ShieldCheck', label: 'Кабинет администратора' },
  head: { path: '/admin/head-workspace', icon: 'BarChart2', label: 'Кабинет руководителя' },
};

const StaffHomePage = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  const cachedName = sessionStorage.getItem('staff_name') || '';
  const cachedRole = (sessionStorage.getItem('staff_role') as StaffRole) || null;

  useEffect(() => {
    (async () => {
      const staff = await fetchMe();
      if (staff) {
        setMe(staff);
        sessionStorage.setItem('staff_name', staff.full_name);
        sessionStorage.setItem('staff_role', staff.role);
      } else if (!cachedName) {
        navigate('/admin');
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLogout = async () => {
    await logoutStaff();
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('staff_role');
    sessionStorage.removeItem('staff_name');
    navigate('/admin');
  };

  const fullName = me?.full_name || cachedName;
  const role = (me?.role || cachedRole) as StaffRole | null;
  const dash = role ? ROLE_DASH[role] : null;

  if (loading && !cachedName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <p className="text-gray-500">Загрузка…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <button
          onClick={onLogout}
          title="Выйти"
          className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 shadow-sm transition-all duration-200"
        >
          <Icon name="LogOut" size={20} />
          <span className="text-sm font-medium pr-1">Выйти</span>
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-4">
            {me?.avatar_url ? (
              <img src={me.avatar_url} alt="Аватар" className="w-full h-full object-cover" />
            ) : (
              <Icon name="User" size={30} className="text-green-600" />
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{fullName || 'Сотрудник'}</h1>
          {role && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
              <Icon name="BadgeCheck" size={15} />
              {ROLE_LABELS[role]}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {dash && (
            <button
              onClick={() => navigate(dash.path)}
              className="flex items-center gap-4 w-full bg-white rounded-xl border-2 border-green-300 hover:border-green-500 p-5 text-left shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="p-3 rounded-lg bg-green-100 flex-shrink-0">
                <Icon name={dash.icon as 'Settings'} size={24} className="text-green-600" />
              </div>
              <div className="font-semibold text-gray-900 text-lg">{dash.label}</div>
              <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto flex-shrink-0" />
            </button>
          )}

          <button
            onClick={() => navigate('/admin/profile')}
            className="flex items-center gap-4 w-full bg-white rounded-xl border-2 border-gray-200 hover:border-gray-400 p-5 text-left shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="p-3 rounded-lg bg-gray-100 flex-shrink-0">
              <Icon name="UserCog" size={24} className="text-gray-600" />
            </div>
            <div className="font-semibold text-gray-900 text-lg">Мой профиль</div>
            <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto flex-shrink-0" />
          </button>
        </div>
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

export default StaffHomePage;