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
import ScenariosPanel from '@/components/finmodel/ScenariosPanel';
import DashboardView from '@/components/finmodel/DashboardView';
import BankPanel from '@/components/finmodel/bank/BankPanel';
import {
  fetchDashboard, fetchScenarios, fetchFixed, setFixedExpense, setMonthInputs, setStaffMonthRate, setStaffRate,
} from '@/lib/finmodelApi';
import type { FinModelState } from './useFinModel';

interface Props {
  fm: FinModelState;
}

const FinModelTabContent = ({ fm }: Props) => {
  const {
    tab, setTab, dash, setDash, active, goTo, setScView, onNotif, onCloseMonth, setFixed,
    scenarios, scLoading, scView, switchScenario, setScenarios,
    adaptation, adLoading, onAdaptChanged,
    cashflow, cfLoading, onCfCredit, onCfPayoutPct,
    pnl, pnlLoading,
    oneTime, onOneTimeSave, onOneTimeDelete,
    payouts, onPayoutSave,
    taxes, onTaxRegime,
    ano, onAnoSave,
    credit, onCreditOption,
    fixed, fixedAction,
    students,
    revenue, onSetPct,
    data, fact, onBankChanged,
  } = fm;

  return tab === 'dashboard' ? (
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
  ) : tab === 'bank' ? (
    <BankPanel onModelChanged={onBankChanged} />
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
    <OneTimeExpensesTable data={oneTime!} onSave={onOneTimeSave} onDelete={onOneTimeDelete} />
  ) : tab === 'payouts' ? (
    <PayoutsTable data={payouts!} active={active} onSave={onPayoutSave} />
  ) : tab === 'taxes' ? (
    <TaxesTable data={taxes!} active={active} onRegime={onTaxRegime} />
  ) : tab === 'ano' ? (
    <AnoTable data={ano!} onSave={onAnoSave} />
  ) : tab === 'credit' ? (
    <CreditTable data={credit!} onOption={onCreditOption} />
  ) : tab === 'fixed' ? (
    <FixedExpensesTable
      data={fixed!}
      active={active}
      onExpense={(m, id, a) => fixedAction(() => setFixedExpense(m, id, a))}
      onInputs={(m, v) => fixedAction(() => setMonthInputs(m, v))}
      onStaffMonth={(sid, m, r) => fixedAction(() => setStaffMonthRate(sid, m, r))}
      onStaffRate={(sid, r) => fixedAction(() => setStaffRate(sid, r))}
    />
  ) : tab === 'students' ? (
    <StudentsTable data={students!} />
  ) : tab === 'revenue' ? (
    <RevenueTable data={revenue!} active={active} onSetPct={onSetPct} />
  ) : tab === 'avans' ? (
    <>
      <AvansForecastTable data={data!} active={active} />
      <AvansHistoryTable data={data!} />
    </>
  ) : (
    <>
      <FactForecastTable data={fact!} active={active} />
      <FactCharts fact={fact!} avans={data!} active={active} />
    </>
  );
};

export default FinModelTabContent;