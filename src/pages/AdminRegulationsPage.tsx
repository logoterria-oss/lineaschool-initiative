import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import Icon from '@/components/ui/icon';
import RegulationsSection from '@/components/teacher/RegulationsSection';

const AdminRegulationsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate('/admin/manager')}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Icon name="BookOpen" size={24} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Регламент</h1>
              <p className="text-gray-500 text-sm">Правила проведения занятий</p>
            </div>
          </div>

          <RegulationsSection />
        </div>
      </div>
    </div>
  );
};

export default AdminRegulationsPage;
