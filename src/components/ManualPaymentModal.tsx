import { useState } from 'react';
import Icon from '@/components/ui/icon';

const ADD_MANUAL_URL = 'https://functions.poehali.dev/975b62cd-bb6b-4608-8d61-f15b29e93b89';

const OTHER = '__other__';

// Названия совпадают с тарифами из PricingSection, чтобы аналитика в отчётах строилась корректно
const PLAN_OPTIONS: { value: string; amount: number }[] = [
  { value: 'Диагностика - Диагностика + консультация', amount: 1290 },
  { value: '2 урока в неделю - 1 месяц', amount: 10960 },
  { value: '2 урока в неделю - 3 месяца', amount: 30000 },
  { value: '2 урока в неделю - 6 месяцев', amount: 55200 },
  { value: '3 урока в неделю - 1 месяц', amount: 14400 },
  { value: '3 урока в неделю - 3 месяца', amount: 39600 },
  { value: '3 урока в неделю - 6 месяцев', amount: 74160 },
  { value: '4 урока в неделю - 1 месяц', amount: 18880 },
  { value: '4 урока в неделю - 3 месяца', amount: 50400 },
  { value: '4 урока в неделю - 6 месяцев', amount: 93120 },
];

interface ManualPaymentModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function ManualPaymentModal({ onClose, onSaved }: ManualPaymentModalProps) {
  const [name, setName] = useState('');
  const [planSelect, setPlanSelect] = useState('');
  const [otherComment, setOtherComment] = useState('');
  const [amount, setAmount] = useState('');
  const [paidDate, setPaidDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOther = planSelect === OTHER;

  const handlePlanChange = (value: string) => {
    setPlanSelect(value);
    const opt = PLAN_OPTIONS.find((p) => p.value === value);
    if (opt) setAmount(String(opt.amount));
  };

  const handleSubmit = async () => {
    setError(null);
    const finalPlan = isOther
      ? `Другое (${otherComment.trim()})`
      : planSelect;

    if (!name.trim() || !planSelect || !amount) {
      setError('Заполните имя, тариф и сумму');
      return;
    }
    if (isOther && !otherComment.trim()) {
      setError('Укажите комментарий для тарифа «Другое»');
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
          plan: finalPlan,
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
            <select
              value={planSelect}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <option value="" disabled>Выберите тариф</option>
              {PLAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} — {opt.amount.toLocaleString('ru-RU')} ₽
                </option>
              ))}
              <option value={OTHER}>Другое (указать вручную)</option>
            </select>
          </div>

          {isOther && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий к тарифу</label>
              <input
                value={otherComment}
                onChange={(e) => setOtherComment(e.target.value)}
                placeholder="Например: возврат, индивидуальное занятие"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
          )}

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
