import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import Icon from '@/components/ui/icon';

const SECTIONS = [
  {
    id: 'payments',
    label: 'Оплаты',
    description: 'Заявки и статусы оплат',
    icon: 'CreditCard' as const,
    color: 'border-orange-200 hover:border-orange-400',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    path: '/admin/payment-leads',
  },
  {
    id: 'reports',
    label: 'Отчёты',
    description: 'Авансовые доходы и аналитика',
    icon: 'FileText' as const,
    color: 'border-green-200 hover:border-green-400',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    path: '/admin/head-reports',
  },
  {
    id: 'supervisions',
    label: 'Супервизии',
    description: 'Оценка работы педагогов',
    icon: 'UserCheck' as const,
    color: 'border-indigo-200 hover:border-indigo-400',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    path: '/admin/head-supervisions',
  },
];

const HeadDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate('/admin/role-select')} className="text-gray-400 hover:text-gray-700 transition-colors">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Icon name="BarChart2" size={24} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Кабинет руководителя</h1>
              <p className="text-gray-500 text-sm">Оплаты, отчёты, аналитика</p>
            </div>
          </div>

          <div className="space-y-3">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => navigate(section.path, { state: { from: '/admin/head' } })}
                className={`w-full flex items-center gap-4 bg-white rounded-xl border-2 ${section.color} p-5 text-left shadow-sm hover:shadow-md transition-all duration-200`}
              >
                <div className={`p-3 rounded-lg ${section.iconBg} flex-shrink-0`}>
                  <Icon name={section.icon} size={24} className={section.iconColor} />
                </div>
                <div className="font-semibold text-gray-900 text-lg">{section.label}</div>
                <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadDashboard;