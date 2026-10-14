import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useSubscriptionCheck } from './useSubscriptionCheck';
import SubscriptionCheckRow from './SubscriptionCheckRow';

type Filter = 'problems' | 'tariff' | 'pay' | 'all';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'problems', label: 'Требуют внимания' },
  { id: 'tariff', label: 'Абонемент / списания' },
  { id: 'pay', label: 'Оплата в CRM' },
  { id: 'all', label: 'Все оплаты' },
];

const TARIFF_CODES = ['tariff_not_changed', 'tariff_late', 'wrong_lesson_price', 'no_tariff_price'];
const PAY_CODES = ['no_crm_pay', 'pay_amount', 'no_customer'];

const thisMonth = () => new Date().toISOString().slice(0, 7);

const SubscriptionCheckView = () => {
  const [month, setMonth] = useState(thisMonth());
  const [filter, setFilter] = useState<Filter>('problems');
  const [hideDiag, setHideDiag] = useState(true);
  const { rows, loading, error, progress, reload } = useSubscriptionCheck(month);

  const stats = useMemo(() => {
    const has = (codes: string[]) => rows.filter((r) => r.issues.some((i) => codes.includes(i.code))).length;
    return {
      errors: rows.filter((r) => r.status === 'error').length,
      tariff: has(TARIFF_CODES),
      pay: has(PAY_CODES),
      lost: rows.reduce((s, r) => s + r.issues.reduce((a, i) => a + (i.diff || 0), 0), 0),
      ok: rows.filter((r) => r.status === 'ok').length,
    };
  }, [rows]);

  const shown = useMemo(() => {
    return rows.filter((r) => {
      if (hideDiag && r.kind === 'diagnostic' && r.status !== 'error') return false;
      if (filter === 'all') return true;
      if (filter === 'problems') return r.status === 'error' || r.status === 'warn';
      const codes = filter === 'tariff' ? TARIFF_CODES : PAY_CODES;
      return r.issues.some((i) => codes.includes(i.code));
    });
  }, [rows, filter, hideDiag]);

  const checking = progress.total > 0 && progress.done < progress.total;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Корректность абонементов в CRM</h2>
        <p className="text-sm text-gray-500 mt-1">
          Сверка: деньги, которые пришли школе → оплата, проведённая в CRM → абонемент, который стоит у ученика.
          Красным — где абонемент забыли заменить и уроки списываются по старой цене.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
        />
        <button
          onClick={reload}
          disabled={loading || checking}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <Icon name="RefreshCw" size={14} className={checking ? 'animate-spin' : ''} />
          Перепроверить
        </button>
        {checking && (
          <span className="text-sm text-gray-500">
            Проверяю абонементы в CRM: {progress.done} из {progress.total}
          </span>
        )}
      </div>

      {!loading && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <div className="text-2xl font-bold text-red-700">{stats.errors}</div>
            <div className="text-xs text-red-700/80">оплат с ошибками</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="text-2xl font-bold text-amber-700">{stats.tariff}</div>
            <div className="text-xs text-amber-700/80">абонемент не заменён / уроки по старой цене</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="text-2xl font-bold text-gray-800">{Math.round(stats.lost).toLocaleString('ru-RU')} ₽</div>
            <div className="text-xs text-gray-500">недосписано с уроков</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="text-2xl font-bold text-emerald-700">{stats.ok}</div>
            <div className="text-xs text-emerald-700/80">оформлено верно</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              filter === f.id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={hideDiag} onChange={(e) => setHideDiag(e.target.checked)} />
          Скрыть диагностики без ошибок
        </label>
      </div>

      {loading && <div className="py-10 text-center text-gray-500">Загружаю оплаты…</div>}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      {!loading && !error && shown.length === 0 && (
        <div className="py-10 text-center text-gray-500">
          {checking ? 'Пока расхождений не найдено, проверка идёт…' : 'Расхождений нет'}
        </div>
      )}
      <div className="space-y-3">
        {shown.map((r) => (
          <SubscriptionCheckRow key={r.key} row={r} />
        ))}
      </div>
    </div>
  );
};

export default SubscriptionCheckView;
