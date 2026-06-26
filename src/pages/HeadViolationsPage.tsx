import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import Icon from '@/components/ui/icon';
import TeacherViolationsManager from '@/components/violations/TeacherViolationsManager';

const HeadViolationsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate('/admin/manager')}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="p-2 bg-red-100 rounded-lg">
              <Icon name="AlertTriangle" size={24} className="text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Дисциплинарные нарушения педагогов
              </h1>
            </div>
          </div>

          <TeacherViolationsManager />
        </div>
      </div>
    </div>
  );
};

export default HeadViolationsPage;