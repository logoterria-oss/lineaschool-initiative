import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { CheckRow } from './subscriptionCheckApi';

const money = (v: number) => `${Math.round(v).toLocaleString('ru-RU')} ₽`;
const day = (d?: string | null) => (d ? d.slice(0, 10).split('-').reverse().join('.') : '—');

const STATUS = {
  ok: { icon: 'CircleCheck', cls: 'text-emerald-600', bg: 'bg-white' },
  warn: { icon: 'CircleAlert', cls: 'text-amber-500', bg: 'bg-amber-50/40' },
  error: { icon: 'CircleX', cls: 'text-red-600', bg: 'bg-red-50/50' },
  pending: { icon: 'Loader', cls: 'text-gray-400 animate-spin', bg: 'bg-white' },
} as const;

const Cell = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="min-w-0">
    <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">{title}</div>
    <div className="text-sm text-gray-800">{children}</div>
  </div>
);

const SubscriptionCheckRow = ({ row }: { row: CheckRow }) => {
  const [open, setOpen] = useState(false);
  const st = STATUS[row.status];
  const tariff = row.tariffAtPayment;
  const hasDetails = !!row.wrongLessons?.length;

  return (
    <div className={`border border-gray-200 rounded-xl p-4 ${st.bg}`}>
      <div className="flex items-start gap-3">
        <Icon name={st.icon} size={20} className={`${st.cls} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-semibold text-gray-900">{row.student}</span>
            <span className="text-xs text-gray-500">
              {row.kind === 'diagnostic' ? 'Диагностика' : row.plan || (row.source === 'crm_only' ? 'Оплата только в CRM' : '')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <Cell title="Пришло нам">
              {row.source === 'crm_only' ? (
                <span className="text-gray-400">нет в эквайринге (наличные / перевод?)</span>
              ) : (
                <>{money(row.amount)} · {day(row.date)}</>
              )}
            </Cell>
            <Cell title="Оплата в CRM">
              {row.crmPay ? (
                <>
                  {money(row.crmPay.amount)} · {day(row.crmPay.date)}
                </>
              ) : (
                <span className="text-red-600 font-medium">не проведена</span>
              )}
            </Cell>
            <Cell title="Абонемент в CRM на дату оплаты">
              {row.status === 'pending' ? (
                <span className="text-gray-400">проверяю…</span>
              ) : tariff ? (
                <span className={tariff.archive ? 'text-amber-700' : ''}>
                  {tariff.name}
                  {tariff.price ? <span className="text-gray-400"> · {money(tariff.price)}</span> : null}
                </span>
              ) : (
                <span className="text-gray-400">нет действующего</span>
              )}
            </Cell>
          </div>

          {row.issues.length > 0 && (
            <ul className="mt-3 space-y-1">
              {row.issues.map((i) => (
                <li
                  key={i.code}
                  className={`text-sm flex items-start gap-1.5 ${i.level === 'warn' ? 'text-amber-700' : 'text-red-700'}`}
                >
                  <Icon name="ArrowRight" size={14} className="mt-0.5 flex-shrink-0" />
                  <span>
                    {i.text}
                    {i.diff ? <b> · недосписано {money(i.diff)}</b> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {row.expectedTariff && row.status === 'error' && (
            <div className="mt-2 text-xs text-gray-500">
              Должен стоять: <span className="text-gray-700">{row.expectedTariff}</span>
              {row.expectedLessonPrice?.length ? ` · ${row.expectedLessonPrice.map(money).join(' / ')} за урок` : ''}
            </div>
          )}

          {hasDetails && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="mt-2 text-xs text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
            >
              <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={14} />
              {open ? 'Скрыть уроки' : 'Какие уроки'}
            </button>
          )}
          {open && hasDetails && (
            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-white">
              {row.wrongLessons!.map((l, idx) => (
                <div key={idx} className="flex justify-between gap-3 px-3 py-1.5 text-xs border-b border-gray-100 last:border-0">
                  <span className="text-gray-700">{day(l.date)}</span>
                  <span className="text-gray-500 truncate">{l.tariff}</span>
                  <span className="font-medium text-red-700">{money(l.charged)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckRow;
