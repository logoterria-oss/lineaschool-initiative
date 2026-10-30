import Icon from '@/components/ui/icon';
import { RESPONSE_THRESHOLDS } from './kpiSummary';

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

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <Icon name="Timer" size={20} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">1. Скорость ответа</h3>
          <p className="text-sm text-gray-600">
            Как считаем: среднее время от первого сообщения родителя до ответа админа в «Окне взаимодействия» за месяц.
          </p>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-left">
          <tr>
            <th className="px-3 py-2 font-semibold">Среднее время ответа</th>
            <th className="px-3 py-2 font-semibold">Премия</th>
          </tr>
        </thead>
        <tbody>
          {RESPONSE_THRESHOLDS.map((t) => (
            <tr key={t.range} className="border-t border-gray-100">
              <td className="px-3 py-2 text-gray-800">{t.range}</td>
              <td className="px-3 py-2 text-gray-800">
                {t.percent} % ({Math.round((240 * t.percent) / 100)} ₽)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminKpiView;
