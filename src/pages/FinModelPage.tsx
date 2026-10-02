import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import AvansForecastTable from '@/components/finmodel/AvansForecastTable';
import AvansHistoryTable from '@/components/finmodel/AvansHistoryTable';
import {
  AvansData, SCENARIOS, SCENARIO_LABEL, Scenario, fetchAvans, fmMoney, setActiveScenario,
} from '@/lib/finmodelApi';

const FinModelPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AvansData | null>(null);
  const [active, setActive] = useState<Scenario>('base');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const d = await fetchAvans();
      setData(d);
      setActive(d.active_scenario);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const switchScenario = async (sc: Scenario) => {
    setActive(sc);
    try {
      await setActiveScenario(sc);
    } catch {
      setError('Не удалось сохранить сценарий');
    }
  };

  const annual = data ? data.forecast.reduce((s, r) => s + (r[active]?.forecast_final || 0), 0) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="flex items-start gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 mt-1">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Финансовая модель</h1>
            <p className="text-gray-500 text-sm mt-1">Модуль «Доходы»: авансовые доходы</p>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            <Icon name="Loader2" size={26} className="animate-spin mx-auto mb-2" />
            Загружаем авансы и прогноз…
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-center gap-3">
            <Icon name="TriangleAlert" size={18} />
            <span className="flex-1">{error}</span>
            <button onClick={load} className="underline">Повторить</button>
          </div>
        )}

        {data && !loading && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[220px]">
                <div className="text-xs text-gray-500">Прогноз авансов на 12 месяцев · {SCENARIO_LABEL[active]}</div>
                <div className="text-3xl font-bold text-emerald-700">{fmMoney(annual)}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Обновлено: {data.updated_at ? new Date(data.updated_at).toLocaleString('ru-RU') : '—'}
                </div>
              </div>
              <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                {SCENARIOS.map((sc) => (
                  <button
                    key={sc}
                    onClick={() => switchScenario(sc)}
                    className={`px-4 py-2 rounded-md text-sm transition-colors ${
                      active === sc ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'
                    }`}
                  >
                    {SCENARIO_LABEL[sc]}
                  </button>
                ))}
              </div>
            </div>

            <AvansForecastTable data={data} active={active} />
            <AvansHistoryTable data={data} />
          </>
        )}
      </div>
    </div>
  );
};

export default FinModelPage;
