import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { listStaff, Staff } from '@/lib/staffApi';

// Общая сводка по показателям всех администраторов — видна только руководителям.
const AdminKpiSummaryView = () => {
  const [admins, setAdmins] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listStaff().then((list) => {
      setAdmins(list.filter((s) => s.role === 'admin' && s.status !== 'blocked'));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-3">
        <div className="p-2 bg-violet-100 rounded-lg">
          <Icon name="LayoutDashboard" size={24} className="text-violet-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Общая сводка</h2>
          <p className="text-sm text-gray-500">Показатели KPI по всем администраторам</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-10 text-center text-gray-400">
            <Icon name="Loader2" size={24} className="animate-spin mx-auto mb-2" />
            Загрузка…
          </div>
        ) : admins.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">Администраторов пока нет</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-semibold">Администратор</th>
                <th className="px-4 py-2 font-semibold">Баллы KPI</th>
                <th className="px-4 py-2 font-semibold">Премия</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{a.full_name}</td>
                  <td className="px-4 py-2.5 text-gray-400">—</td>
                  <td className="px-4 py-2.5 text-gray-400">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-400">Значения появятся, когда будут заданы метрики KPI.</p>
    </div>
  );
};

export default AdminKpiSummaryView;
