import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import PaymentReportModal from '@/components/PaymentReportModal';
import RetentionReportModal from '@/components/RetentionReportModal';

const REPORTS = [
  {
    id: 'advance-income',
    label: 'Авансовые доходы',
    description: 'Оплаты за месяц или произвольный период — PDF',
    icon: 'TrendingUp' as const,
    color: 'border-green-200 hover:border-green-400',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    id: 'fact-income',
    label: 'Фактические доходы',
    description: 'Заработано по проведённым занятиям — по каждому ученику за год',
    icon: 'Table' as const,
    color: 'border-emerald-200 hover:border-emerald-400',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'retention',
    label: 'Коэффициент удержания',
    description: 'Первичное и долгосрочное удержание клиентов',
    icon: 'Users' as const,
    color: 'border-indigo-200 hover:border-indigo-400',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'student-dynamics',
    label: 'Динамика количества учеников',
    description: 'Активные и действующие ученики по неделям, месяцам, кварталам',
    icon: 'LineChart' as const,
    color: 'border-blue-200 hover:border-blue-400',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
];

const ReportsFinView = () => {
  const navigate = useNavigate();
  const [openReport, setOpenReport] = useState<string | null>(null);

  return (
    <>
      <div className="space-y-3">
        {REPORTS.map((report) => (
          <button
            key={report.id}
            onClick={() =>
              report.id === 'student-dynamics'
                ? navigate('/admin/report/student-dynamics')
                : report.id === 'fact-income'
                  ? navigate('/admin/report/fact-income')
                  : setOpenReport(report.id)
            }
            className={`w-full flex items-center gap-4 bg-white rounded-xl border-2 ${report.color} p-5 text-left shadow-sm hover:shadow-md transition-all duration-200`}
          >
            <div className={`p-3 rounded-lg ${report.iconBg} flex-shrink-0`}>
              <Icon name={report.icon} size={24} className={report.iconColor} />
            </div>
            <div className="font-semibold text-gray-900 text-lg">{report.label}</div>
            <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto flex-shrink-0" />
          </button>
        ))}
      </div>

      {openReport === 'advance-income' && <PaymentReportModal onClose={() => setOpenReport(null)} />}
      {openReport === 'retention' && <RetentionReportModal onClose={() => setOpenReport(null)} />}
    </>
  );
};

export default ReportsFinView;
