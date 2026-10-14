import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useSubscriptionCheck } from './useSubscriptionCheck';
import { CheckRow } from './subscriptionCheckApi';

type Filter = 'all' | 'error' | 'ok';

const money = (v?: number | null) => (v || v === 0 ? `${Math.round(v).toLocaleString('ru-RU')} ₽` : '—');
const day = (d?: string | null) => (d ? d.slice(0, 10).split('-').reverse().join('.') : '');

const ROW_BG = {
  ok: 'bg-emerald-50 hover:bg-emerald-100/70',
  error: 'bg-red-50 hover:bg-red-100/70',
  pending: 'bg-white',
} as const;

const PayCell = ({ pay, mismatch }: { pay: CheckRow['ourPay']; mismatch?: boolean }) =>
  pay ? (
    <div>
      <div className={`font-medium ${mismatch ? 'text-red-700' : 'text-gray-900'}`}>{money(pay.amount)}</div>
      <div className="text-xs text-gray-500">{day(pay.date)}</div>
    </div>
  ) : (
    <span className="text-gray-400">—</span>
  );

const TariffCell = ({ row }: { row: CheckRow }) => {
  if (!row.checked) return <span className="text-gray-400">проверяю…</span>;
  const t = row.tariffNow;
  const next = row.tariffNext;
  return (
    <div className="space-y-1">
      {t ? (
        <div>
          <div className="text-gray-900">{t.name}</div>
          <div className="text-xs text-gray-500">
            {money(t.price)} · {day(t.since)}–{day(t.till)}
            {t.expired && <span className="text-amber-700"> · закончился</span>}
          </div>
        </div>
      ) : (
        <span className="text-gray-400">нет абонемента</span>
      )}
      {next && (
        <div className="text-xs text-gray-600 border-t border-gray-200/70 pt-1">
          <span className="text-gray-400">Следующий с {day(next.since)}:</span> {next.name} · {money(next.price)}
        </div>
      )}
    </div>
  );
};

const LessonCell = ({ row }: { row: CheckRow }) => {
  if (!row.checked) return <span className="text-gray-400">…</span>;
  const l = row.lastLesson;
  if (!l) return <span className="text-gray-400">уроков не было</span>;
  const wrong = l.expected != null && Math.abs(l.expected - l.charged) > 1;
  return (
    <div>
      <div className={`font-medium ${wrong ? 'text-red-700' : 'text-gray-900'}`}>{money(l.charged)}</div>
      <div className="text-xs text-gray-500">
        {day(l.date)}
        {wrong && <> · надо {money(l.expected)}</>}
      </div>
    </div>
  );
};

const SubscriptionCheckView = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const { rows, loading, error, progress, reload } = useSubscriptionCheck();

  const counts = useMemo(
    () => ({
      all: rows.length,
      error: rows.filter((r) => r.status === 'error').length,
      ok: rows.filter((r) => r.status === 'ok').length,
    }),
    [rows],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) => (filter === 'all' || r.status === filter) && (!q || r.student.toLowerCase().includes(q)),
    );
  }, [rows, filter, query]);

  const checking = progress.total > 0 && progress.done < progress.total;

  const FILTERS: { id: Filter; label: string; cls: string }[] = [
    { id: 'all', label: `Все · ${counts.all}`, cls: 'bg-gray-800 text-white border-gray-800' },
    { id: 'error', label: `Ошибки · ${counts.error}`, cls: 'bg-red-600 text-white border-red-600' },
    { id: 'ok', label: `Верно · ${counts.ok}`, cls: 'bg-emerald-600 text-white border-emerald-600' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Корректность абонементов в CRM</h2>
        <p className="text-sm text-gray-500 mt-1">
          Все занимающиеся ученики. Зелёная строка — платёж проведён в CRM той же суммой, оплаченный абонемент
          заведён (сейчас или следующим), а последний урок списан по цене абонемента. Иначе — красная.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              filter === f.id ? f.cls : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по ФИО"
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white w-48"
          />
        </div>
        <button
          onClick={reload}
          disabled={loading || checking}
          className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <Icon name="RefreshCw" size={14} className={checking ? 'animate-spin' : ''} />
          {checking ? `Проверяю ${progress.done} из ${progress.total}` : 'Обновить из CRM'}
        </button>
      </div>

      {loading && <div className="py-10 text-center text-gray-500">Загружаю учеников и оплаты…</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2.5 font-medium">ФИО</th>
                <th className="px-3 py-2.5 font-medium">Последний платёж</th>
                <th className="px-3 py-2.5 font-medium">Проведено в CRM</th>
                <th className="px-3 py-2.5 font-medium min-w-[260px]">Абонемент в CRM</th>
                <th className="px-3 py-2.5 font-medium">Списание за урок</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const payMismatch =
                  !!r.ourPay && !!r.crmPay && Math.abs(r.ourPay.amount - r.crmPay.amount) >= 1;
                return (
                  <tr key={r.customerId} className={`border-t border-gray-200 align-top ${ROW_BG[r.status]}`}>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900">{r.student}</div>
                      {r.issues.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {r.issues.map((i) => (
                            <li key={i} className="text-xs text-red-700 flex gap-1">
                              <Icon name="CircleAlert" size={12} className="mt-0.5 flex-shrink-0" />
                              {i}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-3 py-2.5"><PayCell pay={r.ourPay} /></td>
                    <td className="px-3 py-2.5"><PayCell pay={r.crmPay} mismatch={payMismatch} /></td>
                    <td className="px-3 py-2.5"><TariffCell row={r} /></td>
                    <td className="px-3 py-2.5"><LessonCell row={r} /></td>
                  </tr>
                );
              })}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-500">Никого не найдено</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400">
        «Последний платёж» — онлайн-оплата или ручной платёж, внесённый в систему. Наличные и переводы видны только в
        колонке CRM. Диагностики не учитываются.
      </p>
    </div>
  );
};

export default SubscriptionCheckView;
