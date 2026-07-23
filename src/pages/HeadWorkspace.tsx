import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import AdminHeader from '@/components/AdminHeader';
import { fetchMe, logoutStaff, Staff, StaffRole, ROLE_LABELS } from '@/lib/staffApi';
import { HEAD_MENU, SubItem } from '@/components/headWorkspace/menu';
import StudentsListView from '@/components/headWorkspace/StudentsListView';
import InteractionsView from '@/components/headWorkspace/InteractionsView';
import VacationsView from '@/components/headWorkspace/VacationsView';
import ProgressMonitoringView from '@/components/headWorkspace/ProgressMonitoringView';
import PaymentsView from '@/components/headWorkspace/PaymentsView';
import ScheduleView from '@/components/headWorkspace/ScheduleView';
import DocsView from '@/components/headWorkspace/DocsView';
import HomeworkControlSection from '@/components/teacher/HomeworkControlSection';
import WorkScheduleSection from '@/components/teacher/WorkScheduleSection';
import RegulationsView from '@/components/headWorkspace/RegulationsView';
import ReportsFinView from '@/components/headWorkspace/ReportsFinView';
import UsersView from '@/components/headWorkspace/UsersView';
import SupervisionsView from '@/components/headWorkspace/SupervisionsView';
import StubView from '@/components/headWorkspace/StubView';
import TeacherViolationsManager from '@/components/violations/TeacherViolationsManager';
import InteractionWindow from '@/components/interaction/InteractionWindow';

const HeadWorkspace = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<Staff | null>(null);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [active, setActive] = useState<SubItem | null>(null);

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

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));

  const onLogout = async () => {
    await logoutStaff();
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('staff_role');
    sessionStorage.removeItem('staff_name');
    navigate('/admin');
  };

  const handleSelect = (item: SubItem) => {
    if (item.kind === 'link' && item.path) {
      navigate(item.path, { state: { from: '/admin/head-workspace' } });
      return;
    }
    setActive(item);
  };

  const content = useMemo(() => {
    if (!active) return null;
    if (active.id === 'interaction-window') return <InteractionWindow />;
    if (active.kind === 'stub') return <StubView label={active.label} />;
    switch (active.id) {
      case 'students-list': return <StudentsListView />;
      case 'interactions': return <InteractionsView />;
      case 'vacations': return <VacationsView />;
      case 'progress': return <ProgressMonitoringView />;
      case 'payments': return <PaymentsView />;
      case 'reports-fin': return <ReportsFinView />;
      case 'users': return <UsersView />;
      case 'schedule': return <ScheduleView />;
      case 'reports': return <DocsView />;
      case 'homework': return <HomeworkControlSection />;
      case 'worktime': return <WorkScheduleSection readOnly />;
      case 'regulations': return <RegulationsView />;
      case 'supervisions': return <SupervisionsView />;
      case 'violations': return <TeacherViolationsManager withRole />;
      case 'interaction-window': return <InteractionWindow />;
      default: return <StubView label={active.label} />;
    }
  }, [active]);

  const interactionActive = active?.id === 'interaction-window';

  const collapsed = interactionActive;
  const lbl = collapsed
    ? 'overflow-hidden whitespace-nowrap opacity-0 max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[200px] transition-all duration-200'
    : 'flex-1';

  const Sidebar = (
    <aside
      className={`group w-full flex-shrink-0 space-y-4 transition-[width] duration-200 ${
        collapsed ? 'lg:w-20 lg:hover:w-80' : 'lg:w-80'
      }`}
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-amber-100 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
            {me?.avatar_url ? (
              <img src={me.avatar_url} alt="Аватар" className="w-full h-full object-cover" />
            ) : (
              <Icon name="User" size={22} className="text-amber-600" />
            )}
          </div>
          <div className={`min-w-0 ${collapsed ? 'opacity-0 lg:group-hover:opacity-100 transition-opacity' : ''}`}>
            <div className="font-semibold text-gray-900 truncate">{fullName}</div>
            {(me?.job_title || role) && (
              <div className="text-xs text-amber-700 font-medium truncate">
                {me?.job_title || (role && ROLE_LABELS[role])}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/profile')}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
        >
          <Icon name="UserCog" size={16} className="flex-shrink-0" />
          <span className={lbl}>Мой профиль</span>
        </button>
      </div>

      <button
        onClick={() => setActive({ id: 'interaction-window', label: 'Окно взаимодействия', kind: 'stub', icon: 'MessagesSquare' })}
        className={`w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-3 rounded-2xl shadow-sm transition-colors ${
          interactionActive ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        <Icon name="MessagesSquare" size={18} className="flex-shrink-0" />
        <span className={collapsed ? 'overflow-hidden whitespace-nowrap opacity-0 max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[200px] transition-all duration-200' : ''}>Окно взаимодействия</span>
      </button>

      <nav className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2">
        {HEAD_MENU.map((group) => {
          const open = openGroups.includes(group.id);
          return (
            <div key={group.id} className="mb-1 last:mb-0">
              <button
                onClick={() => toggleGroup(group.id)}
                title={collapsed ? group.label : undefined}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <Icon name={group.icon as 'BookOpen'} size={18} className="text-gray-500 flex-shrink-0" />
                <span className={`font-semibold text-sm text-left ${lbl}`}>{group.label}</span>
                {!collapsed && <Icon name={open ? 'ChevronDown' : 'ChevronRight'} size={16} className="text-gray-400" />}
              </button>
              {open && !collapsed && (
                <div className="mt-0.5 mb-1 pl-3 space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = active?.id === item.id && item.kind !== 'link';
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                          isActive
                            ? 'bg-amber-50 text-amber-800 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex-1">{item.label}</span>
                        {item.kind === 'link' && <Icon name="ExternalLink" size={13} className="text-gray-300" />}
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
        {/* Мобилка: если выбран раздел — показываем контент с кнопкой назад */}
        <div className="lg:hidden">
          {active && active.kind !== 'link' ? (
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

        {/* ПК: сайдбар слева + контент справа */}
        <div className="hidden lg:flex gap-6 items-start">
          {Sidebar}
          <main className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            {active && active.kind !== 'link' ? (
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

export default HeadWorkspace;