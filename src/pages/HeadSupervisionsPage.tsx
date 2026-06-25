import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import Icon from '@/components/ui/icon';

const SUBSECTIONS = [
  {
    id: 'add',
    label: 'Добавить супервизию',
    description: 'Внести оценку супервизии педагога',
    icon: 'PlusCircle' as const,
    color: 'border-emerald-200 hover:border-emerald-400',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'summary',
    label: 'Сводная таблица',
    description: 'Все супервизии и средние баллы',
    icon: 'Table' as const,
    color: 'border-indigo-200 hover:border-indigo-400',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
];

const HeadSupervisionsPage = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);

  const activeItem = SUBSECTIONS.find((s) => s.id === active);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => (active ? setActive(null) : navigate('/admin/head'))}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Icon name="UserCheck" size={24} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Супервизии</h1>
              <p className="text-gray-500 text-sm">Оценка работы педагогов</p>
            </div>
          </div>

          {!active ? (
            <div className="space-y-3">
              {SUBSECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`w-full flex items-center gap-4 bg-white rounded-xl border-2 ${s.color} p-5 text-left shadow-sm hover:shadow-md transition-all duration-200`}
                >
                  <div className={`p-3 rounded-lg ${s.iconBg} flex-shrink-0`}>
                    <Icon name={s.icon} size={24} className={s.iconColor} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">{s.label}</div>
                    <div className="text-sm text-gray-500">{s.description}</div>
                  </div>
                  <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className={`inline-flex p-4 rounded-full ${activeItem?.iconBg} mb-4`}>
                <Icon name={activeItem!.icon} size={32} className={activeItem?.iconColor} />
              </div>
              <p className="text-lg font-medium text-gray-500">
                Раздел «{activeItem?.label}» в разработке
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeadSupervisionsPage;
