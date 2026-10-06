import { useCallback, useEffect, useState } from 'react';
import type AnoTable from '@/components/finmodel/AnoTable';
import type PayoutsTable from '@/components/finmodel/PayoutsTable';
import type OneTimeExpensesTable from '@/components/finmodel/OneTimeExpensesTable';
import type { View as ScenarioView } from '@/components/finmodel/ScenariosPanel';
import { exportModelCsv, exportModelXlsx } from '@/components/finmodel/dashboardUtils';
import { checkBankMailIfStale } from '@/lib/bankApi';
import { autoFixClosedMonths } from '@/lib/unitMarginSnapshot';
import {
  DashboardData, fetchDashboard, notificationAction, setTaxRegimeGlobal, recalcModel, TaxRegimeGlobal,
  AdaptationData, fetchAdaptation, ScenariosData, fetchScenarios, CashflowData, fetchCashflow, PnlData, fetchPnl, OneTimeData, fetchOneTime, saveOneTime, deleteOneTime, PayoutData, fetchPayouts, setPayout, AnoData, fetchAno, setAno, TaxData, TaxRegime, fetchTaxes, setTaxRegime, AvansData, CreditData, CreditOption, fetchCredit, setCreditOption, FactData, FixedData, fetchFixed, RevenueData, Scenario, StudentsData, fetchAvans, fetchFact,
  fetchRevenue, fetchStudents, setActiveScenario, setVariablePct,
} from '@/lib/finmodelApi';

export type Tab = 'dashboard' | 'avans' | 'fact' | 'revenue' | 'students' | 'fixed' | 'credit' | 'ano' | 'taxes' | 'payouts' | 'one_time' | 'pnl' | 'cashflow' | 'adaptation' | 'scenarios' | 'bank';

export const useFinModel = () => {
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
      // Сначала фиксируем завершённые месяцы маржинальности урока (один раз): финмодель берёт из них переменный %.
      await autoFixClosedMonths().catch(() => null);
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

  // Выписки банков с почты: в фоне, не чаще раза в 6 часов. Если пришли новые операции — освежаем дашборд.
  useEffect(() => {
    checkBankMailIfStale()
      .then((r) => {
        if (!r.skipped && r.inserted > 0) {
          setCashflow(null);
          fetchDashboard().then(setDash).catch(() => undefined);
        }
      })
      .catch(() => undefined);
  }, []);

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

  // Закрыть месяц: авансы и факт — из отчётов (fetchAvans/fetchFact закрывают сами),
  // затем адаптация и пересчёт прогнозов на сервере.
  const onCloseMonth = () =>
    top('close', async () => {
      await fetchAvans();
      await fetchFact();
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

  // Банк изменил факт Cash Flow: сбрасываем закэшированный Cash Flow и обновляем дашборд.
  const onBankChanged = () => {
    setCashflow(null);
    refreshDash().catch(() => undefined);
  };

  const notifTabs = new Set((dash?.notifications || []).map((n) => (n.action_url === 'close_month' ? 'avans' : n.action_url)));
  const unread = (dash?.notifications || []).filter((n) => !n.read_at).length;
  const monthOpen = !!dash && (dash.notifications.some((n) => n.type === 'month_not_closed') || dash.to_close.avans.length > 0 || dash.to_close.fact.length > 0);

  const annual = data ? data.forecast.reduce((s, r) => s + (r[active]?.forecast_final || 0), 0) : 0;
  const annualFact = fact ? fact.forecast.reduce((s, r) => s + (r[active]?.fact_final || 0), 0) : 0;

  return {
    data, fact, revenue, students, fixed, setFixed, credit, ano, taxes, payouts, oneTime,
    pnl, pnlLoading, cashflow, cfLoading, adaptation, adLoading, scenarios, setScenarios, scLoading,
    tab, setTab, dash, setDash, scView, setScView, busyTop, active, loading, error, load,
    onAdaptChanged, onCfCredit, onCfPayoutPct, switchScenario, onSetPct,
    fixedAction, onAnoSave, onOneTimeSave, onOneTimeDelete, onPayoutSave, onTaxRegime, onCreditOption,
    goTo, onBankChanged, onCloseMonth, onRecalc, onTaxGlobal, onCreditTop, onScenarioTop, onNotif, onExport,
    notifTabs, unread, monthOpen, annual, annualFact,
  };
};

export type FinModelState = ReturnType<typeof useFinModel>;