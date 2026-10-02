import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import AvansForecastTable from '@/components/finmodel/AvansForecastTable';
import AvansHistoryTable from '@/components/finmodel/AvansHistoryTable';
import FactForecastTable from '@/components/finmodel/FactForecastTable';
import FactCharts from '@/components/finmodel/FactCharts';
import RevenueTable from '@/components/finmodel/RevenueTable';
import StudentsTable from '@/components/finmodel/StudentsTable';
import FixedExpensesTable from '@/components/finmodel/FixedExpensesTable';
import CreditTable from '@/components/finmodel/CreditTable';
import AnoTable from '@/components/finmodel/AnoTable';
import TaxesTable from '@/components/finmodel/TaxesTable';
import PayoutsTable from '@/components/finmodel/PayoutsTable';
import OneTimeExpensesTable from '@/components/finmodel/OneTimeExpensesTable';
import PnlTable from '@/components/finmodel/PnlTable';
import CashflowTable from '@/components/finmodel/CashflowTable';
import AdaptationPanel from '@/components/finmodel/AdaptationPanel';
import {
  AdaptationData, fetchAdaptation, CashflowData, fetchCashflow, PnlData, fetchPnl, OneTimeData, fetchOneTime, saveOneTime, deleteOneTime, PayoutData, fetchPayouts, setPayout, AnoData, fetchAno, setAno, TaxData, TaxRegime, fetchTaxes, setTaxRegime, AvansData, CreditData, CreditOption, fetchCredit, setCreditOption, FactData, FixedData, fetchFixed, setFixedExpense, setMonthInputs, setStaffMonthRate, setStaffRate, RevenueData, SCENARIOS, SCENARIO_LABEL, Scenario, StudentsData, closeStudents, fetchAvans, fetchFact,
  fetchRevenue, fetchStudents, fmMoney, setActiveScenario, setStudents, setVariablePct,
} from '@/lib/finmodelApi';

type Tab = 'avans' | 'fact' | 'revenue' | 'students' | 'fixed' | 'credit' | 'ano' | 'taxes' | 'payouts' | 'one_time' | 'pnl' | 'cashflow' | 'adaptation';

const FinModelPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AvansData | null>(null);
  const [fact, setFact] = useState<FactData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [students, setStudentsData] = useState<StudentsData | null>(null);
  const [fixed, setFixed] = useState<FixedData | null>(null);
  const [credit, setCredit] = useState<CreditData | null>(null);
  const [ano, setAnoData] = useState<AnoData | null>(null);
  const [taxes, setTaxes] = useState<TaxData | null>(null);
  const [payouts, setPayouts] = useState<PayoutData | null>(null);
  const [oneTime, setOneTime] = useState<OneTimeData | null>(null);
  const [pnl, setPnl] = useState<PnlData | null>(null);
  const [pnlLoading, setPnlLoading] = useState(false);
  const [cashflow, setCashflow] = useState<CashflowData | null>(null);
  const [cfLoading, setCfLoading] = useState(false);
  const [adaptation, setAdaptation] = useState<AdaptationData | null>(null);
  const [adLoading, setAdLoading] = useState(false);
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
      const st = await fetchStudents();
      const fx = await fetchFixed();
      const cr = await fetchCredit();
      const an = await fetchAno();
      const tx = await fetchTaxes();
      const po = await fetchPayouts();
      const ot = await fetchOneTime();
      setData(d);
      setFact(f);
      setRevenue(r);
      setStudentsData(st);
      setFixed(fx);
      setCredit(cr);
      setAnoData(an);
      setTaxes(tx);
      setPayouts(po);
      setOneTime(ot);
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

  useEffect(() => {
    if (tab !== 'pnl' || loading) return;
    let cancelled = false;
    setPnlLoading(true);
    fetchPnl()
      .then((p) => !cancelled && setPnl(p))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Не удалось загрузить P&L'))
      .finally(() => !cancelled && setPnlLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab, loading]);

  useEffect(() => {
    if (tab !== 'cashflow' || loading) return;
    let cancelled = false;
    setCfLoading(true);
    fetchCashflow()
      .then((c) => !cancelled && setCashflow(c))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Не удалось загрузить Cash Flow'))
      .finally(() => !cancelled && setCfLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab, loading]);

  useEffect(() => {
    if (tab !== 'adaptation' || loading) return;
    let cancelled = false;
    setAdLoading(true);
    fetchAdaptation()
      .then((a) => !cancelled && setAdaptation(a))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Не удалось загрузить адаптацию'))
      .finally(() => !cancelled && setAdLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab, loading]);

  // После изменения K / отмены адаптации прогнозы пересчитаны на сервере — обновляем всё, что от них зависит.
  const onAdaptChanged = async () => {
    const a = await fetchAdaptation();
    setAdaptation(a);
    const [d, f, r, fx, tx, po] = await Promise.all([
      fetchAvans(), fetchFact(), fetchRevenue(), fetchFixed(), fetchTaxes(), fetchPayouts(),
    ]);
    setData(d);
    setFact(f);
    setRevenue(r);
    setFixed(fx);
    setTaxes(tx);
    setPayouts(po);
  };

  const onCfCredit = async (opt: CreditOption) => {
    await onCreditOption(opt);
    const [c, cf] = await Promise.all([fetchCredit(), fetchCashflow()]);
    setCredit(c);
    setCashflow(cf);
  };

  const onCfPayoutPct = async (month: string, pct: number | null) => {
    try {
      await setPayout(month, { payout_pct: pct });
      const [po, cf] = await Promise.all([fetchPayouts(), fetchCashflow()]);
      setPayouts(po);
      setCashflow(cf);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    }
  };

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
      setPayouts(await fetchPayouts());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить процент');
    }
  };

  const onCloseStudents = async (month: string) => {
    try {
      await closeStudents(month);
      setStudentsData(await fetchStudents());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось закрыть месяц');
    }
  };

  const onManualStudents: Parameters<typeof StudentsTable>[0]['onManual'] = async (month, v) => {
    try {
      await setStudents(month, v);
      setStudentsData(await fetchStudents());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    }
  };

  const fixedAction = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      setFixed(await fetchFixed());
      setTaxes(await fetchTaxes());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
      throw e;
    }
  };

  const onAnoSave: Parameters<typeof AnoTable>[0]['onSave'] = async (month, v) => {
    try {
      await setAno(month, v);
      setAnoData(await fetchAno());
      setFixed(await fetchFixed());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
      throw e;
    }
  };

  const onOneTimeSave: Parameters<typeof OneTimeExpensesTable>[0]['onSave'] = async (v) => {
    await saveOneTime(v);
    setOneTime(await fetchOneTime());
  };

  const onOneTimeDelete = async (id: number) => {
    try {
      await deleteOneTime(id);
      setOneTime(await fetchOneTime());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить');
    }
  };

  const onPayoutSave: Parameters<typeof PayoutsTable>[0]['onSave'] = async (month, v) => {
    try {
      await setPayout(month, v);
      setPayouts(await fetchPayouts());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
      throw e;
    }
  };

  const onTaxRegime = async (month: string, regime: TaxRegime | null) => {
    try {
      await setTaxRegime(month, regime);
      setTaxes(await fetchTaxes());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось переключить режим');
    }
  };

  const onCreditOption = async (opt: CreditOption) => {
    try {
      await setCreditOption(opt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить вариант');
      throw e;
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
            <p className="text-gray-500 text-sm mt-1">Доходы, переменные и постоянные расходы, ученики и занятия</p>
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

            <div className="flex flex-wrap gap-x-1 border-b border-gray-200">
              {([['avans', 'Авансовые доходы'], ['fact', 'Фактические доходы'], ['revenue', 'Поступления и переменные'], ['students', 'Ученики и занятия'], ['fixed', 'Постоянные расходы'], ['one_time', 'Разовые расходы'], ['credit', 'Кредит'], ['ano', 'АНО'], ['taxes', 'Налоги'], ['payouts', 'Выплата собственнику'], ['pnl', 'P&L'], ['cashflow', 'Cash Flow'], ['adaptation', 'Адаптация']] as [Tab, string][]).map(([t, label]) => (
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

            {tab === 'adaptation' ? (
              adaptation && !adLoading ? (
                <AdaptationPanel data={adaptation} onChanged={onAdaptChanged} />
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                  <Icon name="Loader2" size={26} className="animate-spin mx-auto mb-2" />
                  Сравниваем факт с прогнозом…
                </div>
              )
            ) : tab === 'cashflow' ? (
              cashflow && !cfLoading ? (
                <CashflowTable data={cashflow} active={active} onCreditOption={onCfCredit} onPayoutPct={onCfPayoutPct} />
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                  <Icon name="Loader2" size={26} className="animate-spin mx-auto mb-2" />
                  Считаем движение денег по всем модулям…
                </div>
              )
            ) : tab === 'pnl' ? (
              pnl && !pnlLoading ? (
                <PnlTable data={pnl} active={active} />
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                  <Icon name="Loader2" size={26} className="animate-spin mx-auto mb-2" />
                  Собираем P&L из всех модулей…
                </div>
              )
            ) : tab === 'one_time' ? (
              <OneTimeExpensesTable data={oneTime} onSave={onOneTimeSave} onDelete={onOneTimeDelete} />
            ) : tab === 'payouts' ? (
              <PayoutsTable data={payouts} active={active} onSave={onPayoutSave} />
            ) : tab === 'taxes' ? (
              <TaxesTable data={taxes} active={active} onRegime={onTaxRegime} />
            ) : tab === 'ano' ? (
              <AnoTable data={ano} onSave={onAnoSave} />
            ) : tab === 'credit' ? (
              <CreditTable data={credit} onOption={onCreditOption} />
            ) : tab === 'fixed' ? (
              <FixedExpensesTable
                data={fixed}
                active={active}
                onExpense={(m, id, a) => fixedAction(() => setFixedExpense(m, id, a))}
                onInputs={(m, v) => fixedAction(() => setMonthInputs(m, v))}
                onStaffMonth={(sid, m, r) => fixedAction(() => setStaffMonthRate(sid, m, r))}
                onStaffRate={(sid, r) => fixedAction(() => setStaffRate(sid, r))}
              />
            ) : tab === 'students' ? (
              <StudentsTable data={students} onClose={onCloseStudents} onManual={onManualStudents} />
            ) : tab === 'revenue' ? (
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
