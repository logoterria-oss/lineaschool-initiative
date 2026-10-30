import Icon from '@/components/ui/icon';

const AdminKpiView = () => (
  <div className="space-y-4">
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-3">
      <div className="p-2 bg-emerald-100 rounded-lg">
        <Icon name="Target" size={24} className="text-emerald-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Метрики KPI</h2>
        <p className="text-sm text-gray-500">Показатели, по которым оценивается работа администратора</p>
      </div>
    </div>

    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
      <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon name="ListChecks" size={26} className="text-emerald-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">Критерии KPI скоро появятся</h3>
      <p className="text-gray-400 text-sm max-w-md mx-auto">
        Здесь будут показатели, по которым оценивается работа администратора, и расчёт премии.
      </p>
    </div>
  </div>
);

export default AdminKpiView;
