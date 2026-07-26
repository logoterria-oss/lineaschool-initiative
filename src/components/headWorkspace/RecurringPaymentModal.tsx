import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { CATEGORIES, PaymentDraft, periodLabel } from './useRecurringPayments';

const PERIOD_OPTIONS = [1, 3, 6, 12];

const EMPTY: PaymentDraft = {
  title: '',
  category: CATEGORIES[0],
  amount: '',
  period_months: 1,
  next_date: '',
  note: '',
  is_active: true,
};

interface Props {
  initial?: PaymentDraft | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: PaymentDraft) => Promise<boolean>;
}

const RecurringPaymentModal = ({ initial, saving, onClose, onSave }: Props) => {
  const [draft, setDraft] = useState<PaymentDraft>(EMPTY);
  const [customPeriod, setCustomPeriod] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (initial) {
      setDraft(initial);
      setCustomPeriod(!PERIOD_OPTIONS.includes(initial.period_months));
    } else {
      setDraft(EMPTY);
      setCustomPeriod(false);
    }
  }, [initial]);

  const upd = (patch: Partial<PaymentDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const submit = async () => {
    setErr('');
    if (!draft.title.trim()) return setErr('Укажите назначение платежа');
    if (!draft.next_date) return setErr('Укажите дату следующего платежа');
    if (!draft.period_months || draft.period_months < 1) return setErr('Период должен быть не меньше 1 месяца');
    const ok = await onSave(draft);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {draft.id ? 'Редактировать платёж' : 'Новый регулярный платёж'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Назначение платежа</label>
            <input
              value={draft.title}
              onChange={(e) => upd({ title: e.target.value })}
              placeholder="Например: Подписка на AlfaCRM"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Категория траты</label>
            <select
              value={draft.category}
              onChange={(e) => upd({ category: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Сумма, ₽</label>
              <input
                type="number"
                value={draft.amount}
                onChange={(e) => upd({ amount: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата платежа</label>
              <input
                type="date"
                value={draft.next_date}
                onChange={(e) => upd({ next_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Периодичность</label>
            <div className="flex flex-wrap gap-2">
              {PERIOD_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => { setCustomPeriod(false); upd({ period_months: m }); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    !customPeriod && draft.period_months === m
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {periodLabel(m)}
                </button>
              ))}
              <button
                onClick={() => setCustomPeriod(true)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  customPeriod
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Другое
              </button>
            </div>
            {customPeriod && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-600">Раз в</span>
                <input
                  type="number"
                  min={1}
                  value={draft.period_months}
                  onChange={(e) => upd({ period_months: Number(e.target.value) })}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <span className="text-sm text-gray-600">мес.</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий (необязательно)</label>
            <textarea
              value={draft.note}
              onChange={(e) => upd({ note: e.target.value })}
              rows={2}
              placeholder="Реквизиты, кто оплачивает, ссылка на кабинет..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            />
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
            Отмена
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            {saving && <Icon name="Loader2" size={16} className="animate-spin" />}
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurringPaymentModal;
