import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import Icon from '@/components/ui/icon';
import WorkScheduleSection from '@/components/teacher/WorkScheduleSection';
import HomeworkControlSection from '@/components/teacher/HomeworkControlSection';
import KpiSection from '@/components/teacher/KpiSection';
import { logoutStaff } from '@/lib/staffApi';

const SECTIONS = [
  {
    id: 'schedule',
    label: 'Рабочее время',
    icon: 'Clock' as const,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-200 hover:border-blue-400',
  },
  {
    id: 'homework',
    label: 'Контроль ДЗ',
    icon: 'ClipboardCheck' as const,
    color: 'text-green-600',
    bg: 'bg-green-100',
    border: 'border-green-200 hover:border-green-400',
  },
  {
    id: 'kpi',
    label: 'Супервизии, регламенты, KPI',
    icon: 'BarChart2' as const,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    border: 'border-orange-200 hover:border-orange-400',
  },
];

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const onLogout = async () => {
    await logoutStaff();
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('staff_role');
    sessionStorage.removeItem('staff_name');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">

          {/* Заголовок */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => activeSection ? setActiveSection(null) : navigate('/admin/role-select')}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon name="GraduationCap" size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Кабинет педагога</h1>
              {activeSection && (
                <p className="text-gray-500 text-sm">
                  {SECTIONS.find((s) => s.id === activeSection)?.label}
                </p>
              )}
            </div>
            <button
              onClick={onLogout}
              className="ml-auto flex items-center gap-2 bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 text-sm font-medium px-3 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Icon name="LogOut" size={16} />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>

          {/* Главное меню */}
          {!activeSection && (
            <div className="space-y-3">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-4 bg-white rounded-xl border-2 ${section.border} p-5 text-left shadow-sm hover:shadow-md transition-all duration-200`}
                >
                  <div className={`p-3 rounded-lg ${section.bg} flex-shrink-0`}>
                    <Icon name={section.icon} size={24} className={section.color} />
                  </div>
                  <span className="font-semibold text-gray-900 text-lg">{section.label}</span>
                  <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Раздел: Рабочее время */}
          {activeSection === 'schedule' && <WorkScheduleSection />}

          {/* Раздел: Контроль ДЗ */}
          {activeSection === 'homework' && <HomeworkControlSection />}

          {/* Раздел: Оценка качества и KPI */}
          {activeSection === 'kpi' && <KpiSection />}

        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;