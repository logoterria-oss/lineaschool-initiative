import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import Icon from '@/components/ui/icon';

const ManagerDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate('/admin/role-select')} className="text-gray-400 hover:text-gray-700 transition-colors">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icon name="ShieldCheck" size={24} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Кабинет администратора</h1>
              <p className="text-gray-500 text-sm">Управление школой</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-purple-100 p-12 text-center text-gray-400">
            <Icon name="Construction" size={40} className="mx-auto mb-4 text-purple-200" />
            <p className="text-lg font-medium text-gray-500">Раздел в разработке</p>
            <p className="text-sm mt-1">Здесь будут инструменты для администратора</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
