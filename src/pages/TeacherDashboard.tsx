import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import Icon from '@/components/ui/icon';
import WorkScheduleSection from '@/components/teacher/WorkScheduleSection';

const SECTIONS = [
  {
    id: 'schedule',
    label: 'Рабочее время',
    icon: 'Clock' as const,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-200 hover:border-blue-400',
  },
];

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
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

        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
