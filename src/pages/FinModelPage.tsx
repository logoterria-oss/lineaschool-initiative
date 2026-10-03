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
import ScenariosPanel, { View as ScenarioView } from '@/components/finmodel/ScenariosPanel';
import DashboardView from '@/components/finmodel/DashboardView';
import { exportModelCsv, exportModelXlsx } from '@/components/finmodel/dashboardUtils';
import {
  DashboardData, fetchDashboard, notificationAction, setTaxRegimeGlobal, closeStudentsPrev, recalcModel, TaxRegimeGlobal, fmMonthLabel,
  AdaptationData, fetchAdaptation, ScenariosData, fetchScenarios, CashflowData, fetchCashflow, PnlData, fetchPnl, OneTimeData, fetchOneTime, saveOneTime, deleteOneTime, PayoutData, fetchPayouts, setPayout, AnoData, fetchAno, setAno, TaxData, TaxRegime, fetchTaxes, setTaxRegime, AvansData, CreditData, CreditOption, fetchCredit, setCreditOption, FactData, FixedData, fetchFixed, setFixedExpense, setMonthInputs, setStaffMonthRate, setStaffRate, RevenueData, SCENARIOS, SCENARIO_LABEL, Scenario, StudentsData, closeStudents, fetchAvans, fetchFact,
  fetchRevenue, fetchStudents, fmMoney, setActiveScenario, setStudents, setVariablePct,
} from '@/lib/finmodelApi';

type Tab = 'dashboard' | 'avans' | 'fact' | 'revenue' | 'students' | 'fixed' | 'credit' | 'ano' | 'taxes' | 'payouts' | 'one_time' | 'pnl' | 'cashflow' | 'adaptation' | 'scenarios';

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
  const [scenarios, setScenarios] = useState<ScenariosData | null>(null);
  const [scLoading, setScLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [scView, setScView] = useState<ScenarioView>('compare');
  const [busyTop, setBusyTop] = useState<string | null>(null);
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
      const db = await fetchDashboard();
      setDash(db);
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

  useEffect(() => {
    if (tab !== 'scenarios' || loading) return;
    let cancelled = false;
    setScLoading(true);
    fetchScenarios()
      .then((d) => !cancelled && setScenarios(d))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Не удалось загрузить сценарии'))
      .finally(() => !cancelled && setScLoading(false));
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

  const refreshDash = async () => setDash(await fetchDashboard());

  const goTo = (target: string) => {
    const map: Record<string, Tab> = { close_month: 'avans' };
    setTab((map[target] || target) as Tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const top = async (key: string, fn: () => Promise<unknown>) => {
    setBusyTop(key);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось выполнить');
    } finally {
      setBusyTop(null);
    }
  };

  // Закрыть месяц: авансы и факт — из отчётов (fetchAvans/fetchFact закрывают сами), ученики — по отчётам,
  // затем адаптация и пересчёт прогнозов на сервере.
  const onCloseMonth = () =>
    top('close', async () => {
      await fetchAvans();
      await fetchFact();
      try {
        await closeStudentsPrev();
      } catch (e) {
        setError(`Авансы и факт закрыты. Ученики: ${e instanceof Error ? e.message : 'не закрыты'} — вкладка «Ученики и занятия».`);
      }
      await load();
    });

  const onRecalc = () => top('recalc', async () => { await recalcModel(); await load(); });

  const onTaxGlobal = (v: TaxRegimeGlobal) =>
    top('tax', async () => { await setTaxRegimeGlobal(v); setTaxes(await fetchTaxes()); await refreshDash(); });

  const onCreditTop = (o: CreditOption) =>
    top('credit', async () => { await setCreditOption(o); setCredit(await fetchCredit()); await refreshDash(); });

  const onScenarioTop = async (sc: Scenario) => {
    await switchScenario(sc);
    top('sc', refreshDash);
  };

  const onNotif = async (op: 'dismiss' | 'snooze' | 'read' | 'restore', id?: number) => {
    await notificationAction(op, id);
    if (op !== 'read') await refreshDash();
  };

  const bundle = async () => {
    const [p, c] = await Promise.all([pnl ? Promise.resolve(pnl) : fetchPnl(), cashflow ? Promise.resolve(cashflow) : fetchCashflow()]);
    setPnl(p);
    setCashflow(c);
    return { dash: dash!, avans: data!, fact: fact!, revenue: revenue!, fixed: fixed!, oneTime: oneTime!, credit: credit!,
      ano: ano!, taxes: taxes!, payouts: payouts!, pnl: p, cashflow: c, active };
  };
  const onExport = (fmt: 'xlsx' | 'csv' | 'pdf') =>
    top(`export_${fmt}`, async () => {
      if (fmt === 'pdf') {
        setTab('dashboard');
        setTimeout(() => window.print(), 400);
        return;
      }
      const b = await bundle();
      if (fmt === 'xlsx') exportModelXlsx(b);
      else exportModelCsv(b);
    });

  const notifTabs = new Set((dash?.notifications || []).map((n) => (n.action_url === 'close_month' ? 'avans' : n.action_url)));
  const unread = (dash?.notifications || []).filter((n) => !n.read_at).length;
  const monthOpen = !!dash && (dash.notifications.some((n) => n.type === 'month_not_closed') || dash.to_close.avans.length > 0 || dash.to_close.fact.length > 0);

  const annual = data ? data.forecast.reduce((s, r) => s + (r[active]?.forecast_final || 0), 0) : 0;
  const annualFact = fact ? fact.forecast.reduce((s, r) => s + (r[active]?.fact_final || 0), 0) : 0;

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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3 print:hidden">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Текущий месяц: </span>
                  <span className="font-medium text-gray-900">{dash ? fmMonthLabel(dash.current_month) : '—'}</span>
                </div>
                <div className="text-gray-500">
                  Обновлено: {dash?.last_updated ? new Date(dash.last_updated).toLocaleString('ru-RU') : '—'}
                </div>
                <div className="text-gray-500">
                  Авансы 12 мес: <span className="font-medium text-emerald-700">{fmMoney(annual)}</span> · Факт: <span className="font-medium text-indigo-700">{fmMoney(annualFact)}</span>
                </div>
                <div className="flex-1" />
                <button
                  onClick={() => { setTab('dashboard'); setTimeout(() => document.getElementById('fm-notifications')?.scrollIntoView({ behavior: 'smooth' }), 50); }}
                  className="relative inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
                  title="Уведомления"
                >
                  <Icon name="Bell" size={18} />
                  {(dash?.notifications.length || 0) > 0 && (
                    <span className={`absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] leading-[18px] text-center text-white ${unread ? 'bg-rose-600' : 'bg-gray-400'}`}>
                      {dash!.notifications.length}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                  {SCENARIOS.map((sc) => (
                    <button key={sc} onClick={() => onScenarioTop(sc)}
                      className={`px-3 py-1.5 rounded-md text-sm ${active === sc ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'}`}>
                      {SCENARIO_LABEL[sc]}
                    </button>
                  ))}
                </div>
                <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50" title="Налоговый режим для текущего и будущих месяцев">
                  {([['auto', 'Авто'], ['usn', 'УСН'], ['patent', 'Патент']] as [TaxRegimeGlobal, string][]).map(([v, l]) => (
                    <button key={v} disabled={busyTop !== null} onClick={() => onTaxGlobal(v)}
                      className={`px-3 py-1.5 rounded-md text-sm ${(dash?.tax_regime || 'auto') === v ? 'bg-sky-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'}`}>
                      {l}
                    </button>
                  ))}
                </div>
                <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                  {(['6m', '12m'] as CreditOption[]).map((o) => (
                    <button key={o} disabled={busyTop !== null} onClick={() => onCreditTop(o)}
                      className={`px-3 py-1.5 rounded-md text-sm ${credit.option === o ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'}`}>
                      Кредит {o === '6m' ? '6' : '12'} мес
                    </button>
                  ))}
                </div>
                <div className="flex-1" />
                {monthOpen && (
                  <button disabled={busyTop !== null} onClick={onCloseMonth}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 text-white text-sm disabled:opacity-50">
                    <Icon name={busyTop === 'close' ? 'Loader2' : 'CalendarCheck'} size={15} className={busyTop === 'close' ? 'animate-spin' : ''} />
                    Закрыть {dash ? fmMonthLabel(dash.prev_month) : 'месяц'}
                  </button>
                )}
                <button disabled={busyTop !== null} onClick={onRecalc}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  <Icon name={busyTop === 'recalc' ? 'Loader2' : 'RefreshCw'} size={15} className={busyTop === 'recalc' ? 'animate-spin' : ''} />
                  Пересчитать
                </button>
                <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                  <button disabled={busyTop !== null} onClick={() => onExport('xlsx')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    <Icon name={busyTop === 'export_xlsx' ? 'Loader2' : 'FileSpreadsheet'} size={15} className={busyTop === 'export_xlsx' ? 'animate-spin' : ''} />
                    Excel
                  </button>
                  <button disabled={busyTop !== null} onClick={() => onExport('csv')} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 border-l border-gray-200">CSV</button>
                  <button disabled={busyTop !== null} onClick={() => onExport('pdf')} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 border-l border-gray-200">PDF</button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-1 border-b border-gray-200 print:hidden">
              {([['dashboard', 'Дашборд'], ['avans', 'Авансовые доходы'], ['fact', 'Фактические доходы'], ['revenue', 'Поступления и переменные'], ['students', 'Ученики и занятия'], ['fixed', 'Постоянные расходы'], ['one_time', 'Разовые расходы'], ['credit', 'Кредит'], ['ano', 'АНО'], ['taxes', 'Налоги'], ['payouts', 'Выплата собственнику'], ['pnl', 'P&L'], ['cashflow', 'Cash Flow'], ['scenarios', 'Сценарии'], ['adaptation', 'Адаптация']] as [Tab, string][]).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
                    tab === t ? 'border-gray-900 text-gray-900 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {label}
                  {notifTabs.has(t) && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-rose-500 align-middle" />}
                </button>
              ))}
            </div>

            {tab === 'dashboard' ? (
              dash ? (
                <DashboardView
                  data={dash}
                  active={active}
                  onGo={goTo}
                  onWhatIf={(v) => { setScView(v); setTab('scenarios'); }}
                  onNotif={onNotif}
                  onCloseMonth={onCloseMonth}
                  onChanged={async () => { const [fx, db] = await Promise.all([fetchFixed(), fetchDashboard()]); setFixed(fx); setDash(db); }}
                />
              ) : null
            ) : tab === 'scenarios' ? (
              scenarios && !scLoading ? (
                <ScenariosPanel
                  key={scView}
                  initialView={scView}
                  data={scenarios}
                  active={active}
                  onActive={switchScenario}
                  onChanged={async () => setScenarios(await fetchScenarios())}
                />
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                  <Icon name="Loader2" size={26} className="animate-spin mx-auto mb-2" />
                  Считаем сценарии и таблицы чувствительности…
                </div>
              )
            ) : tab === 'adaptation' ? (
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
