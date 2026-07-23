import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import AdminHeader from '@/components/AdminHeader';
import { fetchMe, logoutStaff, Staff, StaffRole, ROLE_LABELS } from '@/lib/staffApi';
import { ADMIN_MENU, AdminItem } from '@/components/adminWorkspace/menu';
import ScheduleView from '@/components/headWorkspace/ScheduleView';
import InteractionsView from '@/components/headWorkspace/InteractionsView';
import VacationsView from '@/components/headWorkspace/VacationsView';
import ProgressMonitoringView from '@/components/headWorkspace/ProgressMonitoringView';
import StudentsListView from '@/components/headWorkspace/StudentsListView';
import StubView from '@/components/headWorkspace/StubView';
import TeacherViolationsManager from '@/components/violations/TeacherViolationsManager';
import PaymentsStatusView from '@/components/adminWorkspace/PaymentsStatusView';
import LeadsListView from '@/components/adminWorkspace/LeadsListView';
import StaffListView from '@/components/adminWorkspace/StaffListView';

const AdminWorkspace = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<Staff | null>(null);
  const [active, setActive] = useState<AdminItem | null>(null);

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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fullName = me?.full_name || cachedName || 'Сотрудник';
  const role = (me?.role || cachedRole) as StaffRole | null;

  const onLogout = async () => {
    await logoutStaff();
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('staff_role');
    sessionStorage.removeItem('staff_name');
    navigate('/admin');
  };

  const content = useMemo(() => {
    if (!active) return null;
    if (active.kind === 'stub') return <StubView label={active.label} />;
    switch (active.id) {
      case 'schedule': return <ScheduleView />;
      case 'payments-status': return <PaymentsStatusView />;
      case 'interactions': return <InteractionsView />;
      case 'vacations': return <VacationsView />;
      case 'progress': return <ProgressMonitoringView />;
      case 'violations': return <TeacherViolationsManager withRole />;
      case 'students-list': return <StudentsListView />;
      case 'leads-list': return <LeadsListView />;
      case 'staff-list': return <StaffListView />;
      default: return <StubView label={active.label} />;
    }
  }, [active]);

  const Sidebar = (
    <aside className="w-full lg:w-80 flex-shrink-0 space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-purple-100 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
            {me?.avatar_url ? (
              <img src={me.avatar_url} alt="Аватар" className="w-full h-full object-cover" />
            ) : (
              <Icon name="User" size={22} className="text-purple-600" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">{fullName}</div>
            {(me?.job_title || role) && (
              <div className="text-xs text-purple-700 font-medium truncate">
                {me?.job_title || (role && ROLE_LABELS[role])}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/profile')}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
        >
          <Icon name="UserCog" size={16} />
          Мой профиль
        </button>
      </div>

      <nav className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2">
        {ADMIN_MENU.map((item) => {
          const isActive = active?.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                isActive ? 'bg-purple-50 text-purple-800 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon name={item.icon as 'CalendarDays'} size={18} className={isActive ? 'text-purple-600' : 'text-gray-400'} />
              <span className="flex-1">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 text-sm font-medium py-2.5 rounded-xl transition-colors shadow-sm"
      >
        <Icon name="LogOut" size={16} />
        Выйти
      </button>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="lg:hidden">
          {active ? (
            <div>
              <button
                onClick={() => setActive(null)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm mb-4"
              >
                <Icon name="ArrowLeft" size={16} />
                Ко всем разделам
              </button>
              <h1 className="text-xl font-bold text-gray-900 mb-4">{active.label}</h1>
              {content}
            </div>
          ) : (
            Sidebar
          )}
        </div>

        <div className="hidden lg:flex gap-6 items-start">
          {Sidebar}
          <main className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            {active ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-5">{active.label}</h1>
                {content}
              </>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center text-gray-400">
                <Icon name="MousePointerClick" size={40} className="mb-3" />
                <p className="text-lg font-medium text-gray-500">Выберите раздел слева</p>
                <p className="text-sm">Содержимое откроется здесь</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminWorkspace;
