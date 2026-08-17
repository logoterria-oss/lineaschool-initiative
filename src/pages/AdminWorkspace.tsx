import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import AdminHeader from '@/components/AdminHeader';
import { fetchMe, logoutStaff, Staff, StaffRole, ROLE_LABELS } from '@/lib/staffApi';
import { ADMIN_MENU, ADMIN_GROUPS, AdminItem } from '@/components/adminWorkspace/menu';
import ScheduleView from '@/components/headWorkspace/ScheduleView';
import InteractionsView from '@/components/headWorkspace/InteractionsView';
import VacationsView from '@/components/headWorkspace/VacationsView';
import ProgressMonitoringView from '@/components/headWorkspace/ProgressMonitoringView';
import StudentsListView from '@/components/headWorkspace/StudentsListView';
import StaffListView from '@/components/headWorkspace/StaffListView';
import StubView from '@/components/headWorkspace/StubView';
import TeacherViolationsManager from '@/components/violations/TeacherViolationsManager';
import PaymentsStatusView from '@/components/adminWorkspace/PaymentsStatusView';
import LeadsListView from '@/components/adminWorkspace/LeadsListView';
import WorkTimeView from '@/components/workLog/WorkTimeView';
import AdminShiftsView from '@/components/adminShifts/AdminShiftsView';
import { INTERACTION_URL } from '@/lib/interactionUrl';
import { useInteractionBadges } from '@/components/interaction/useInteractionBadges';

const AdminWorkspace = () => {
  const navigate = useNavigate();
  const { newAssigned, unread, markAssignedSeen } = useInteractionBadges();
  const [me, setMe] = useState<Staff | null>(null);
  const [active, setActive] = useState<AdminItem | null>(null);
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));

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
      case 'admin-shifts': return <AdminShiftsView />;
      case 'schedule': return <ScheduleView />;
      case 'payments-status': return <PaymentsStatusView />;
      case 'interactions': return <InteractionsView />;
      case 'vacations': return <VacationsView />;
      case 'progress': return <ProgressMonitoringView />;
      case 'violations': return <TeacherViolationsManager withRole />;
      case 'students-list': return <StudentsListView />;
      case 'leads-list': return <LeadsListView />;
      case 'staff-list': return <StaffListView readOnly />;
      case 'work-log': return <WorkTimeView />;
      default: return <StubView label={active.label} />;
    }
  }, [active]);

  const workLogActive = active?.id === 'work-log';

  const collapsed = false;
  const lbl = collapsed
    ? 'overflow-hidden whitespace-nowrap opacity-0 max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[200px] lg:group-hover:ml-0 transition-all duration-200'
    : 'flex-1';

  const Sidebar = (
    <aside
      className={`group w-full flex-shrink-0 space-y-4 transition-[width] duration-200 ${
        collapsed ? 'lg:w-20 lg:hover:w-80' : 'lg:w-80'
      }`}
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-purple-100 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
            {me?.avatar_url ? (
              <img src={me.avatar_url} alt="Аватар" className="w-full h-full object-cover" />
            ) : (
              <Icon name="User" size={22} className="text-purple-600" />
            )}
          </div>
          <div className={`min-w-0 ${collapsed ? 'opacity-0 lg:group-hover:opacity-100 transition-opacity' : ''}`}>
            <div className="font-semibold text-gray-900 truncate">{fullName}</div>
            {(me?.job_title || role) && (
              <div className="text-xs text-purple-700 font-medium truncate">
                {me?.job_title || (role && ROLE_LABELS[role])}
              </div>
            )}
          </div>
        </div>
        {(me?.phone || me?.email) && (
          <div
            className={`mt-2 flex items-center gap-3 text-xs text-gray-500 ${
              collapsed ? 'opacity-0 lg:group-hover:opacity-100 transition-opacity' : ''
            }`}
          >
            {me?.phone && (
              <span className="flex items-center gap-1.5 min-w-0">
                <Icon name="Phone" size={13} className="flex-shrink-0 text-gray-400" />
                <span className="truncate">{me.phone}</span>
              </span>
            )}
            {me?.email && (
              <span className="flex items-center gap-1.5 min-w-0" title={me.email}>
                <Icon name="Mail" size={13} className="flex-shrink-0 text-gray-400" />
                <span className="truncate">{me.email}</span>
              </span>
            )}
          </div>
        )}
        <button
          onClick={() => navigate('/admin/profile')}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
        >
          <Icon name="UserCog" size={16} className="flex-shrink-0" />
          <span className={collapsed ? lbl : ''}>Мой профиль</span>
        </button>
      </div>

      <a
        href={INTERACTION_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={markAssignedSeen}
        className="w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-3 rounded-2xl shadow-sm transition-colors bg-green-500 hover:bg-green-600"
      >
        <span className={collapsed ? 'overflow-hidden whitespace-nowrap opacity-0 max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[200px] transition-all duration-200' : ''}>Окно взаимодействия</span>
        {newAssigned > 0 && (
          <span
            title="Новые чаты, где вас назначили ответственным"
            className="inline-flex items-center gap-0.5 bg-amber-400 text-amber-900 text-[11px] font-bold rounded-full px-1.5 py-0.5"
          >
            <Icon name="Star" size={12} />
            {newAssigned}
          </span>
        )}
        {unread > 0 && (
          <span
            title="Непрочитанные сообщения в ваших чатах"
            className="inline-flex items-center gap-0.5 bg-white text-green-700 text-[11px] font-bold rounded-full px-1.5 py-0.5"
          >
            <Icon name="Mail" size={12} />
            {unread}
          </span>
        )}
      </a>

      <button
        onClick={() => setActive({ id: 'work-log', label: 'Учёт рабочего времени', kind: 'component', icon: 'ClipboardPen' })}
        className={`w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-3 rounded-2xl shadow-sm transition-colors ${
          workLogActive ? 'bg-amber-600' : 'bg-amber-500 hover:bg-amber-600'
        }`}
      >
        <span className={collapsed ? 'overflow-hidden whitespace-nowrap opacity-0 max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[200px] transition-all duration-200' : ''}>Учёт рабочего времени</span>
      </button>

      <nav className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2">
        {ADMIN_MENU.map((item) => {
          const isActive = active?.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                isActive ? 'bg-purple-50 text-purple-800 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon name={item.icon as 'CalendarDays'} size={18} className={`flex-shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
              <span className={lbl}>{item.label}</span>
            </button>
          );
        })}

        {ADMIN_GROUPS.map((group) => {
          const open = openGroups.includes(group.id);
          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                title={collapsed ? group.label : undefined}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon name={group.icon as 'ClipboardList'} size={18} className="text-gray-400 flex-shrink-0" />
                <span className={`${lbl} font-medium`}>{group.label}</span>
                <Icon
                  name={open ? 'ChevronDown' : 'ChevronRight'}
                  size={16}
                  className={`text-gray-400 ${collapsed ? 'opacity-0 max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[16px] transition-all duration-200' : ''}`}
                />
              </button>
              {open && (
                <div className={`mt-0.5 mb-1 pl-3 space-y-0.5 ${collapsed ? 'hidden lg:group-hover:block' : ''}`}>
                  {group.items.map((item) => {
                    const isActive = active?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActive(item)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                          isActive ? 'bg-purple-50 text-purple-800 font-medium' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon name={item.icon as 'GraduationCap'} size={16} className={isActive ? 'text-purple-600' : 'text-gray-400'} />
                        <span className="flex-1">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <button
        onClick={onLogout}
        title={collapsed ? 'Выйти' : undefined}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 text-sm font-medium py-2.5 rounded-xl transition-colors shadow-sm"
      >
        <Icon name="LogOut" size={16} className="flex-shrink-0" />
        <span className={collapsed ? 'overflow-hidden whitespace-nowrap opacity-0 max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[200px] transition-all duration-200' : ''}>Выйти</span>
      </button>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
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