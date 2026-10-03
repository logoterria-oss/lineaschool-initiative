import Icon from '@/components/ui/icon';
import { DashboardData, Scenario, SCENARIO_LABEL, fmMoney, fmMonthLabel } from '@/lib/finmodelApi';
import { toneOf } from './dashboardUtils';

interface Props {
  data: DashboardData;
  active: Scenario;
}

const DashboardKpi = ({ data, active }: Props) => {
  const k = data.kpi[active];
  const start = data.start_balance.total;
  const tiles: { label: string; value: string; tone?: string; hint?: string; icon: string }[] = [
    { label: 'Авансы за 12 мес', value: fmMoney(k.avans), icon: 'Wallet', hint: 'прогноз авансов' },
    { label: 'Факт за 12 мес', value: fmMoney(k.fact), icon: 'BookOpenCheck', hint: 'проведённые уроки' },
    { label: 'Поступления за 12 мес', value: fmMoney(k.revenue), icon: 'ArrowDownToLine', hint: 'аванс − эквайринг' },
    { label: 'Маржинальная прибыль', value: fmMoney(k.margin), tone: toneOf(k.margin, k.fact), icon: 'TrendingUp', hint: 'факт − переменные' },
    { label: 'Чистая прибыль', value: fmMoney(k.net_profit), tone: toneOf(k.net_profit, k.margin), icon: 'BadgeRussianRuble', hint: 'по P&L' },
    { label: 'Выплата собственнику', value: fmMoney(k.payout), icon: 'HandCoins', hint: 'за 12 мес' },
    {
      label: 'Кредит закроется',
      value: data.credit.close_month ? fmMonthLabel(data.credit.close_month) : '—',
      icon: 'Landmark',
      hint: `${data.credit.option === '12m' ? '12' : '6'} мес · ${fmMoney(data.credit.monthly)}/мес`,
    },
    { label: 'Остаток на конец периода', value: fmMoney(k.end_balance), tone: toneOf(k.end_balance, start), icon: 'PiggyBank', hint: data.months.length ? fmMonthLabel(data.months[data.months.length - 1]) : '' },
    {
      label: 'Минимальный остаток',
      value: fmMoney(k.min_balance),
      tone: toneOf(k.min_balance, start),
      icon: 'ArrowDownToDot',
      hint: k.min_month ? `дно — ${fmMonthLabel(k.min_month)}` : '',
    },
  ];

  return (
    <div>
      <div className="text-xs text-gray-500 mb-2">Ключевые показатели · {SCENARIO_LABEL[active]} сценарий</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
              <Icon name={t.icon} fallback="CircleDot" size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500">{t.label}</div>
              <div className={`text-xl font-bold tabular-nums ${t.tone || 'text-gray-900'}`}>{t.value}</div>
              {t.hint && <div className="text-[11px] text-gray-400 truncate">{t.hint}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardKpi;
