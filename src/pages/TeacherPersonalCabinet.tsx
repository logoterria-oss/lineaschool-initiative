import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import AdminHeader from '@/components/AdminHeader';
import { fetchMe, logoutStaff, Staff, StaffRole, ROLE_LABELS } from '@/lib/staffApi';
import { findTeacherByName, TeacherIdentity } from '@/lib/teacherIdentity';
import WorkScheduleSection from '@/components/teacher/WorkScheduleSection';
import HomeworkControlSection from '@/components/teacher/HomeworkControlSection';
import TeacherSupervisions from '@/components/supervision/TeacherSupervisions';
import TeacherViolations from '@/components/violations/TeacherViolations';
import RegulationsKpiSection from '@/components/teacher/RegulationsKpiSection';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

const MENU: MenuItem[] = [
  { id: 'worktime', label: 'Рабочее время', icon: 'Clock' },
  { id: 'homework', label: 'Контроль ДЗ', icon: 'ClipboardCheck' },
  { id: 'supervisions', label: 'Мои супервизии', icon: 'UserCheck' },
  { id: 'violations', label: 'Мои нарушения', icon: 'TriangleAlert' },
  { id: 'regulations', label: 'Регламенты и KPI', icon: 'ScrollText' },
];

const TeacherPersonalCabinet = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<Staff | null>(null);
  const [teacher, setTeacher] = useState<TeacherIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<MenuItem | null>(null);

  const cachedName = sessionStorage.getItem('staff_name') || '';
  const cachedRole = (sessionStorage.getItem('staff_role') as StaffRole) || null;

  useEffect(() => {
    (async () => {
      const staff = await fetchMe();
      if (staff) {
        setMe(staff);
        setTeacher(findTeacherByName(staff.full_name));
        sessionStorage.setItem('staff_name', staff.full_name);
        sessionStorage.setItem('staff_role', staff.role);
      } else if (!cachedName) {
        navigate('/admin');
      } else {
        setTeacher(findTeacherByName(cachedName));
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fullName = me?.full_name || cachedName || 'Педагог';
  const role = (me?.role || cachedRole) as StaffRole | null;

  const onLogout = async () => {
    await logoutStaff();
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('staff_role');
    sessionStorage.removeItem('staff_name');
    navigate('/admin');
  };

  const content = useMemo(() => {
    if (!active || !teacher) return null;
    switch (active.id) {
      case 'worktime': return <WorkScheduleSection lockedTeacherId={teacher.id} />;
      case 'homework': return <HomeworkControlSection lockedTeacher={{ id: teacher.id, name: teacher.name }} />;
      case 'supervisions': return <TeacherSupervisions lockedTeacherId={teacher.id} />;
      case 'violations': return <TeacherViolations lockedTeacherId={teacher.id} />;
      case 'regulations': return <RegulationsKpiSection form={teacher.form} />;
      default: return null;
    }
  }, [active, teacher]);

  const Sidebar = (
    <aside className="w-full flex-shrink-0 space-y-4 lg:w-80">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-100 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
            {me?.avatar_url ? (
              <img src={me.avatar_url} alt="Аватар" className="w-full h-full object-cover" />
            ) : (
              <Icon name="User" size={22} className="text-blue-600" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">{fullName}</div>
            <div className="text-xs text-blue-700 font-medium truncate">
              {me?.job_title || (role && ROLE_LABELS[role]) || 'Педагог'}
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/profile')}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
        >
          <Icon name="UserCog" size={16} className="flex-shrink-0" />
          <span>Мой профиль</span>
        </button>
      </div>

      <nav className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2">
        {MENU.map((item) => {
          const isActive = active?.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                isActive ? 'bg-blue-50 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon name={item.icon as 'Clock'} size={18} className={isActive ? 'text-blue-600' : 'text-gray-500'} />
              <span className="flex-1">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 text-sm font-medium py-2.5 rounded-xl transition-colors shadow-sm"
      >
        <Icon name="LogOut" size={16} className="flex-shrink-0" />
        <span>Выйти</span>
      </button>
    </aside>
  );

  // Если сотрудник не опознан как педагог из списка — данные показать нельзя.
  const notFound = !loading && !teacher;
  const NotFound = (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="inline-flex p-4 rounded-full bg-amber-100 mb-4">
        <Icon name="UserX" size={32} className="text-amber-600" />
      </div>
      <p className="text-gray-700 font-medium mb-1">Профиль педагога не найден</p>
      <p className="text-gray-500 text-sm">
        Ваше имя в аккаунте не совпадает со списком педагогов. Обратитесь к руководителю.
      </p>
    </div>
  );

  const Empty = (
    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center text-gray-400">
      <Icon name="MousePointerClick" size={40} className="mb-3" />
      <p className="text-lg font-medium text-gray-500">Выберите раздел слева</p>
      <p className="text-sm">Содержимое откроется здесь</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Мобилка */}
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
              {notFound ? NotFound : content}
            </div>
          ) : notFound ? (
            NotFound
          ) : (
            Sidebar
          )}
        </div>

        {/* ПК: сайдбар слева + контент справа */}
        <div className="hidden lg:flex gap-6 items-start">
          {Sidebar}
          <main className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            {notFound ? (
              NotFound
            ) : active ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-5">{active.label}</h1>
                {content}
              </>
            ) : (
              Empty
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default TeacherPersonalCabinet;
