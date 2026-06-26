import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
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
    id: 'retention',
    label: 'Коэффициент удержания',
    description: 'Первичное и долгосрочное удержание клиентов',
    icon: 'Users' as const,
    color: 'border-indigo-200 hover:border-indigo-400',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
];

const HeadReportsPage = () => {
  const navigate = useNavigate();
  const [openReport, setOpenReport] = useState<string | null>(null);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <AdminHeader showOnlyHome />
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <button onClick={() => navigate('/admin/head')} className="text-gray-400 hover:text-gray-700 transition-colors">
                <Icon name="ArrowLeft" size={20} />
              </button>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Icon name="FileText" size={24} className="text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Отчёты</h1>
                <p className="text-gray-500 text-sm">Управленческие отчёты и аналитика</p>
              </div>
            </div>

            <div className="space-y-3">
              {REPORTS.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setOpenReport(report.id)}
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
          </div>
        </div>
      </div>

      {openReport === 'advance-income' && <PaymentReportModal onClose={() => setOpenReport(null)} />}
      {openReport === 'retention' && <RetentionReportModal onClose={() => setOpenReport(null)} />}
    </>
  );
};

export default HeadReportsPage;