import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import AvansForecastTable from '@/components/finmodel/AvansForecastTable';
import AvansHistoryTable from '@/components/finmodel/AvansHistoryTable';
import FactForecastTable from '@/components/finmodel/FactForecastTable';
import FactCharts from '@/components/finmodel/FactCharts';
import RevenueTable from '@/components/finmodel/RevenueTable';
import {
  AvansData, FactData, RevenueData, SCENARIOS, SCENARIO_LABEL, Scenario, fetchAvans, fetchFact, fetchRevenue,
  fmMoney, setActiveScenario, setVariablePct,
} from '@/lib/finmodelApi';

type Tab = 'avans' | 'fact' | 'revenue';

const FinModelPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AvansData | null>(null);
  const [fact, setFact] = useState<FactData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [tab, setTab] = useState<Tab>('avans');
  const [active, setActive] = useState<Scenario>('base');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const d = await fetchAvans();
      const f = await fetchFact();
      const r = await fetchRevenue();
      setData(d);
      setFact(f);
      setRevenue(r);
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

  const onSetPct = async (month: string, pct: number | null) => {
    try {
      await setVariablePct(month, pct);
      setRevenue(await fetchRevenue());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить процент');
    }
  };

  const annual = data ? data.forecast.reduce((s, r) => s + (r[active]?.forecast_final || 0), 0) : 0;
  const annualFact = fact ? fact.forecast.reduce((s, r) => s + (r[active]?.fact_final || 0), 0) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="flex items-start gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 mt-1">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Финансовая модель</h1>
            <p className="text-gray-500 text-sm mt-1">Модуль «Доходы»: авансы, факт, поступления и переменные</p>
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

        {data && fact && revenue && !loading && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-wrap items-center gap-4">
              <div className="min-w-[200px]">
                <div className="text-xs text-gray-500">Авансы на 12 мес · {SCENARIO_LABEL[active]}</div>
                <div className="text-3xl font-bold text-emerald-700">{fmMoney(annual)}</div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="text-xs text-gray-500">Факт на 12 мес · {SCENARIO_LABEL[active]}</div>
                <div className="text-3xl font-bold text-indigo-700">{fmMoney(annualFact)}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Обновлено: {fact.updated_at ? new Date(fact.updated_at).toLocaleString('ru-RU') : '—'}
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

            <div className="flex gap-1 border-b border-gray-200">
              {([['avans', 'Авансовые доходы'], ['fact', 'Фактические доходы'], ['revenue', 'Поступления и переменные']] as [Tab, string][]).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
                    tab === t ? 'border-gray-900 text-gray-900 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'revenue' ? (
              <RevenueTable data={revenue} active={active} onSetPct={onSetPct} />
            ) : tab === 'avans' ? (
              <>
                <AvansForecastTable data={data} active={active} />
                <AvansHistoryTable data={data} />
              </>
            ) : (
              <>
                <FactForecastTable data={fact} active={active} />
                <FactCharts fact={fact} avans={data} active={active} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FinModelPage;
