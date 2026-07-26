import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { HintBox } from '@/components/students/studentsTableHelpers';
import RecurringPaymentModal from './RecurringPaymentModal';
import {
  useRecurringPayments,
  RecurringPayment,
  PaymentDraft,
  CATEGORY_META,
  CATEGORIES,
  periodLabel,
  paymentStatus,
  PaymentStatus,
  amountLabel,
} from './useRecurringPayments';

const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`;
}

function daysLeft(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso + 'T00:00:00');
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function toDraft(p: RecurringPayment): PaymentDraft {
  return { ...p, amount: p.amount };
}

const rub = (n: number) => n.toLocaleString('ru-RU') + ' ₽';

const STATUS_META: Record<PaymentStatus, { label: string; badge: string; card: string }> = {
  overdue: { label: 'Просрочен', badge: 'bg-red-100 text-red-700 border-red-200', card: 'border-red-300 bg-red-50/40' },
  'due-soon': { label: 'Скоро оплата', badge: 'bg-amber-100 text-amber-700 border-amber-200', card: 'border-amber-300 bg-amber-50/40' },
  pending: { label: 'Ожидает оплаты', badge: 'bg-gray-100 text-gray-600 border-gray-200', card: 'border-gray-200' },
  paid: { label: 'Оплачено', badge: 'bg-green-100 text-green-700 border-green-200', card: 'border-green-200 bg-green-50/30' },
};

type Tab = 'todo' | 'paid' | 'all';

const RecurringPaymentsView = () => {
  const { items, loading, error, saving, save, markPaid, unmarkPaid, remove } = useRecurringPayments();
  const [modal, setModal] = useState<{ open: boolean; initial: PaymentDraft | null }>({ open: false, initial: null });
  const [catFilter, setCatFilter] = useState<string>('all');
  const [tab, setTab] = useState<Tab>('todo');
  const [confirmDel, setConfirmDel] = useState<RecurringPayment | null>(null);

  const withStatus = useMemo(
    () => items.map((p) => ({ p, status: paymentStatus(p) })),
    [items],
  );

  const todoCount = withStatus.filter((x) => x.status !== 'paid').length;
  const paidCount = withStatus.filter((x) => x.status === 'paid').length;

  const filtered = useMemo(() => {
    let list = withStatus;
    if (tab === 'todo') list = list.filter((x) => x.status !== 'paid');
    if (tab === 'paid') list = list.filter((x) => x.status === 'paid');
    if (catFilter !== 'all') list = list.filter((x) => x.p.category === catFilter);
    return list;
  }, [withStatus, tab, catFilter]);

  // В рублёвые суммы попадают только фиксированные платежи — процент от дохода
  // заранее посчитать нельзя, поэтому он учитывается отдельно (счётчиком).
  const fixed = useMemo(() => items.filter((i) => i.amount_type === 'fixed'), [items]);
  const percentCount = items.length - fixed.length;

  const monthlyTotal = useMemo(
    () => fixed.reduce((s, i) => s + i.amount / i.period_months, 0),
    [fixed],
  );
  const yearlyTotal = useMemo(
    () => fixed.reduce((s, i) => s + (i.amount * 12) / i.period_months, 0),
    [fixed],
  );
  const toPayTotal = useMemo(
    () => withStatus.filter((x) => x.status !== 'paid' && x.p.amount_type === 'fixed').reduce((s, x) => s + x.p.amount, 0),
    [withStatus],
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    fixed.forEach((i) => map.set(i.category, (map.get(i.category) || 0) + i.amount / i.period_months));
    return CATEGORIES.map((c) => ({ category: c, monthly: map.get(c) || 0 })).filter((c) => c.monthly > 0);
  }, [fixed]);

  const openNew = () => setModal({ open: true, initial: null });
  const openEdit = (p: RecurringPayment) => setModal({ open: true, initial: toDraft(p) });

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'todo', label: 'Нужно оплатить', count: todoCount },
    { id: 'paid', label: 'Оплачено', count: paidCount },
    { id: 'all', label: 'Все', count: items.length },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Календарь регулярных платежей</h2>
          <p className="text-gray-500 text-sm mt-0.5">Постоянные траты с датами, статусом и категориями</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm self-start"
        >
          <Icon name="Plus" size={16} />
          Добавить платёж
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-4">
          <div className="text-xs text-amber-600 font-medium">Нужно оплатить</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{rub(Math.round(toPayTotal))}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {todoCount} платежей{percentCount > 0 ? ` + ${percentCount} по % от дохода` : ''}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-xs text-gray-500 font-medium">В месяц (в среднем)</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{rub(Math.round(monthlyTotal))}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-xs text-gray-500 font-medium">В год</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{rub(Math.round(yearlyTotal))}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-xs text-gray-500 font-medium mb-2">По категориям (в месяц)</div>
          <div className="flex flex-wrap gap-1.5">
            {byCategory.length === 0 && <span className="text-sm text-gray-400">Нет данных</span>}
            {byCategory.map((c) => (
              <span
                key={c.category}
                className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2 py-0.5 ${CATEGORY_META[c.category]?.color || 'bg-gray-100 text-gray-600 border-gray-200'}`}
              >
                <Icon name={(CATEGORY_META[c.category]?.icon || 'Circle') as 'Circle'} size={12} />
                {rub(Math.round(c.monthly))}
              </span>
            ))}
          </div>
        </div>
      </div>

      <HintBox
        className="mb-4"
        title="Как работает календарь"
        hints={[
          'Новый платёж по умолчанию в статусе «Ожидает оплаты» — он попадает во вкладку «Нужно оплатить».',
          'Когда оплатите — нажмите «Оплачено»: платёж перейдёт в «Оплачено», а дата сдвинется на следующий период.',
          'Если отметили по ошибке — нажмите «Отменить оплату», всё вернётся назад.',
          'Просроченные подсвечиваются красным, а те, до которых ≤7 дней — жёлтым.',
        ]}
      />

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${tab === t.id ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setCatFilter('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${catFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
        >
          Все категории
        </button>
        {CATEGORIES.map((c) => {
          const count = items.filter((i) => i.category === c).length;
          if (count === 0) return null;
          return (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${catFilter === c ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-gray-500 py-10 text-center">Загрузка...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="CalendarClock" size={26} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {tab === 'paid' ? 'Оплаченных пока нет' : tab === 'todo' ? 'Всё оплачено' : 'Пока нет платежей'}
          </h3>
          <p className="text-gray-400 text-sm">
            {items.length === 0 ? 'Нажмите «Добавить платёж», чтобы завести первую регулярную трату.' : 'Здесь пусто.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(({ p, status }) => {
            const dl = daysLeft(p.next_date);
            const sm = STATUS_META[status];
            const isPaid = status === 'paid';
            const meta = CATEGORY_META[p.category] || { icon: 'Circle', color: 'bg-gray-100 text-gray-600 border-gray-200' };
            return (
              <div
                key={p.id}
                className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3 ${sm.card}`}
              >
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 border ${meta.color}`}>
                  <Icon name={meta.icon as 'Circle'} size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 truncate">{p.title}</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold border rounded-full px-2 py-0.5 ${sm.badge}`}>
                      {isPaid && <Icon name="Check" size={11} />}
                      {sm.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                    <span className={`inline-flex items-center gap-1 font-medium border rounded-full px-2 py-0.5 ${meta.color}`}>
                      {p.category}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Icon name="RefreshCw" size={12} />
                      {periodLabel(p.period_months)}
                    </span>
                  </div>
                  {p.note && <div className="text-xs text-gray-400 mt-1 truncate">{p.note}</div>}
                </div>

                <div className="text-right md:w-44 flex-shrink-0">
                  <div className="font-bold text-gray-900">{amountLabel(p)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {isPaid ? 'Следующий: ' : ''}{fmtDate(p.next_date)}
                  </div>
                  {!isPaid && (
                    <div className={`text-[11px] mt-0.5 ${status === 'overdue' ? 'text-red-600' : status === 'due-soon' ? 'text-amber-600' : 'text-gray-400'}`}>
                      {dl < 0 ? `Просрочен на ${Math.abs(dl)} дн.` : dl === 0 ? 'Сегодня' : `Через ${dl} дн.`}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isPaid ? (
                    <button
                      onClick={() => unmarkPaid(p.id)}
                      title="Отменить оплату (вернуть дату назад)"
                      className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                    >
                      <Icon name="Undo2" size={14} />
                      Отменить
                    </button>
                  ) : (
                    <button
                      onClick={() => markPaid(p.id)}
                      title="Отметить оплаченным (дата сдвинется на следующий период)"
                      className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                    >
                      <Icon name="Check" size={14} />
                      Отметить оплату
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(p)}
                    title="Редактировать"
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Icon name="Pencil" size={16} />
                  </button>
                  <button
                    onClick={() => setConfirmDel(p)}
                    title="Удалить"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal.open && (
        <RecurringPaymentModal
          initial={modal.initial}
          saving={saving}
          onClose={() => setModal({ open: false, initial: null })}
          onSave={save}
        />
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDel(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удалить платёж?</h3>
            <p className="text-sm text-gray-500 mb-5">«{confirmDel.title}» будет удалён из календаря.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
                Отмена
              </button>
              <button
                onClick={() => { remove(confirmDel.id); setConfirmDel(null); }}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringPaymentsView;