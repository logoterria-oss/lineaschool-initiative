import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import Icon from '@/components/ui/icon';
import { fetchMe } from '@/lib/staffApi';
import { findTeacherByName, TeacherIdentity } from '@/lib/teacherIdentity';
import WorkScheduleSection from '@/components/teacher/WorkScheduleSection';
import HomeworkControlSection from '@/components/teacher/HomeworkControlSection';
import TeacherSupervisions from '@/components/supervision/TeacherSupervisions';
import TeacherViolations from '@/components/violations/TeacherViolations';
import RegulationsKpiSection from '@/components/teacher/RegulationsKpiSection';

type IconName =
  | 'Clock' | 'ClipboardCheck' | 'UserCheck' | 'AlertTriangle' | 'BookOpen';

const SECTIONS: {
  id: string;
  label: string;
  icon: IconName;
  color: string;
  bg: string;
  border: string;
}[] = [
  { id: 'schedule', label: 'Рабочее время', icon: 'Clock', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200 hover:border-blue-400' },
  { id: 'homework', label: 'Контроль ДЗ', icon: 'ClipboardCheck', color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200 hover:border-green-400' },
  { id: 'supervisions', label: 'Мои супервизии', icon: 'UserCheck', color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200 hover:border-indigo-400' },
  { id: 'violations', label: 'Мои нарушения', icon: 'AlertTriangle', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200 hover:border-red-400' },
  { id: 'regulations', label: 'Регламенты и KPI', icon: 'BookOpen', color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200 hover:border-purple-400' },
];

const TeacherPersonalCabinet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<TeacherIdentity | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => setTeacher(findTeacherByName(me?.full_name)))
      .finally(() => setLoading(false));
  }, []);

  const active = SECTIONS.find((s) => s.id === activeSection);

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
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Личный кабинет</h1>
              <p className="text-gray-500 text-sm">
                {active ? active.label : teacher ? teacher.name : 'Педагог'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-500 py-16 text-center">Загрузка…</div>
          ) : !teacher ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="inline-flex p-4 rounded-full bg-amber-100 mb-4">
                <Icon name="UserX" size={32} className="text-amber-600" />
              </div>
              <p className="text-gray-700 font-medium mb-1">Профиль педагога не найден</p>
              <p className="text-gray-500 text-sm">
                Ваше имя в аккаунте не совпадает со списком педагогов. Обратитесь к руководителю.
              </p>
            </div>
          ) : (
            <>
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

              {activeSection === 'schedule' && (
                <WorkScheduleSection lockedTeacherId={teacher.id} />
              )}
              {activeSection === 'homework' && (
                <HomeworkControlSection lockedTeacher={{ id: teacher.id, name: teacher.name }} />
              )}
              {activeSection === 'supervisions' && (
                <TeacherSupervisions lockedTeacherId={teacher.id} />
              )}
              {activeSection === 'violations' && (
                <TeacherViolations lockedTeacherId={teacher.id} />
              )}
              {activeSection === 'regulations' && (
                <RegulationsKpiSection form={teacher.form} />
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default TeacherPersonalCabinet;
