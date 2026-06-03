import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import AdminHeader from '@/components/AdminHeader';

const SECTIONS = [
  {
    label: 'Логопедические заключения',
    description: 'Просмотр и управление диагностическими отчётами',
    icon: 'FileText' as const,
    color: 'border-green-200 hover:border-green-400',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    path: '/admin/reports',
  },
  {
    label: 'Анкеты родителей',
    description: 'Просмотр заполненных родительских анкет',
    icon: 'ClipboardList' as const,
    color: 'border-purple-200 hover:border-purple-400',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    path: '/admin/questionnaires',
  },
  {
    label: 'Оплаты',
    description: 'Статус оплаты диагностик и абонементов',
    icon: 'CreditCard' as const,
    color: 'border-orange-200 hover:border-orange-400',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    path: '/admin/payment-leads',
  },
  {
    label: 'Расписание занятий',
    description: 'Групповые и индивидуальные занятия из S20 CRM',
    icon: 'CalendarDays' as const,
    color: 'border-teal-200 hover:border-teal-400',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    path: '/admin/schedule',
  },
];

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate('/admin/role-select')} className="text-gray-400 hover:text-gray-700 transition-colors">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="p-2 bg-green-100 rounded-lg">
              <Icon name="Stethoscope" size={24} className="text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Кабинет диагноста</h1>
              <p className="text-gray-500 text-sm">Управление диагностикой</p>
            </div>
          </div>

          <div className="space-y-3">
            {SECTIONS.map((section) => (
              <button
                key={section.path}
                onClick={() => navigate(section.path)}
                className={`w-full flex items-center gap-4 bg-white rounded-xl border-2 ${section.color} p-5 text-left shadow-sm hover:shadow-md transition-all duration-200`}
              >
                <div className={`p-3 rounded-lg ${section.iconBg} flex-shrink-0`}>
                  <Icon name={section.icon} size={24} className={section.iconColor} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-lg">{section.label}</div>
                  <div className="text-sm text-gray-500">{section.description}</div>
                </div>
                <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
