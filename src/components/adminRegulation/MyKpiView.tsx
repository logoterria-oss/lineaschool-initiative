import Icon from '@/components/ui/icon';

// Личные показатели сотрудника (администратора или руководителя) — у каждого свои.
const MyKpiView = ({ staffName }: { staffName: string }) => (
  <div className="space-y-4">
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-3">
      <div className="p-2 bg-sky-100 rounded-lg">
        <Icon name="UserCheck" size={24} className="text-sky-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Мои показатели</h2>
        <p className="text-sm text-gray-500">{staffName}</p>
      </div>
    </div>

    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
      <div className="w-14 h-14 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon name="BarChart3" size={26} className="text-sky-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">Показатели скоро появятся</h3>
      <p className="text-gray-400 text-sm max-w-md mx-auto">
        Здесь будут ваши личные результаты по метрикам KPI и расчёт премии.
      </p>
    </div>
  </div>
);

export default MyKpiView;
