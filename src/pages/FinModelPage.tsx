import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useFinModel } from '@/components/finmodel/page/useFinModel';
import FinModelHeader from '@/components/finmodel/page/FinModelHeader';
import FinModelTabsNav from '@/components/finmodel/page/FinModelTabsNav';
import FinModelTabContent from '@/components/finmodel/page/FinModelTabContent';

const FinModelPage = () => {
  const navigate = useNavigate();
  const fm = useFinModel();
  const { data, fact, revenue, students, fixed, credit, ano, taxes, payouts, oneTime, loading, error, load } = fm;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4">
        <div className="flex items-start gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 mt-1 print:hidden">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Финансовая модель</h1>
            <p className="text-gray-500 text-sm mt-1">Отчёты → Финансовая модель: прогнозы, P&L, Cash Flow, сценарии и уведомления</p>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            <Icon name="Loader2" size={26} className="animate-spin mx-auto mb-2" />
            Загружаем авансы, факт и прогноз…
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-center gap-3">
            <Icon name="TriangleAlert" size={18} />
            <span className="flex-1">{error}</span>
            <button onClick={load} className="underline">Повторить</button>
          </div>
        )}

        {data && fact && revenue && students && fixed && credit && ano && taxes && payouts && oneTime && !loading && (
          <>
            <FinModelHeader fm={fm} />
            <FinModelTabsNav fm={fm} />
            <FinModelTabContent fm={fm} />
          </>
        )}
      </div>
    </div>
  );
};

export default FinModelPage;
