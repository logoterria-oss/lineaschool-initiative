import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import Icon from '@/components/ui/icon';
import TeacherViolationsManager from '@/components/violations/TeacherViolationsManager';

type RoleId = 'teacher' | 'diagnost' | 'admin' | 'it';

interface RoleCard {
  id: RoleId;
  label: string;
  icon: 'GraduationCap' | 'Stethoscope' | 'ShieldCheck' | 'Code';
  color: string;
  iconBg: string;
  iconColor: string;
}

const ROLES: RoleCard[] = [
  {
    id: 'teacher',
    label: 'Педагог',
    icon: 'GraduationCap',
    color: 'border-blue-200 hover:border-blue-400',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'diagnost',
    label: 'Диагност',
    icon: 'Stethoscope',
    color: 'border-green-200 hover:border-green-400',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    id: 'admin',
    label: 'Администратор',
    icon: 'ShieldCheck',
    color: 'border-purple-200 hover:border-purple-400',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'it',
    label: 'IT-разработчик',
    icon: 'Code',
    color: 'border-slate-200 hover:border-slate-400',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
];

const HeadStaffViolationsPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<RoleId | null>(null);

  const activeRole = ROLES.find((r) => r.id === role) ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className={role ? 'max-w-4xl mx-auto' : 'max-w-2xl mx-auto'}>
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => (role ? setRole(null) : navigate('/admin/head'))}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="p-2 bg-red-100 rounded-lg">
              <Icon name="AlertTriangle" size={24} className="text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {activeRole
                  ? `Дисциплинарные нарушения · ${activeRole.label}`
                  : 'Дисциплинарные нарушения сотрудников'}
              </h1>
            </div>
          </div>

          {!role && (
            <div className="space-y-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`w-full flex items-center gap-4 bg-white rounded-xl border-2 ${r.color} p-5 text-left shadow-sm hover:shadow-md transition-all duration-200`}
                >
                  <div className={`p-3 rounded-lg ${r.iconBg} flex-shrink-0`}>
                    <Icon name={r.icon} size={24} className={r.iconColor} />
                  </div>
                  <div className="font-semibold text-gray-900 text-lg">{r.label}</div>
                  <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {role === 'teacher' && <TeacherViolationsManager />}

          {role && role !== 'teacher' && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="inline-flex p-4 rounded-full bg-red-100 mb-4">
                <Icon name={activeRole!.icon} size={32} className={activeRole!.iconColor} />
              </div>
              <p className="text-lg font-medium text-gray-500">
                Раздел нарушений для роли «{activeRole!.label}» в разработке
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeadStaffViolationsPage;
