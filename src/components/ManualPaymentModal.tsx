import { useState } from 'react';
import Icon from '@/components/ui/icon';

const ADD_MANUAL_URL = 'https://functions.poehali.dev/975b62cd-bb6b-4608-8d61-f15b29e93b89';

interface ManualPaymentModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function ManualPaymentModal({ onClose, onSaved }: ManualPaymentModalProps) {
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('');
  const [amount, setAmount] = useState('');
  const [paidDate, setPaidDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() || !plan.trim() || !amount) {
      setError('Заполните имя, тариф и сумму');
      return;
    }
    setSaving(true);
    try {
      const password = sessionStorage.getItem('admin_password') || '';
      const paidAtIso = paidDate ? new Date(paidDate + 'T12:00:00').toISOString() : '';
      const resp = await fetch(ADD_MANUAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': password },
        body: JSON.stringify({
          name: name.trim(),
          plan: plan.trim(),
          amount: Number(amount),
          paid_at: paidAtIso,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        onSaved();
        onClose();
      } else {
        setError(data.error || 'Не удалось сохранить оплату');
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Добавить оплату вручную</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ФИО клиента</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иванов Иван"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тариф</label>
            <input
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="Абонемент 12 месяцев"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Сумма, ₽</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5990"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата оплаты</label>
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Icon name={saving ? 'Loader2' : 'Plus'} size={16} className={saving ? 'animate-spin' : ''} />
            {saving ? 'Сохраняю…' : 'Добавить оплату'}
          </button>
        </div>
      </div>
    </div>
  );
}
