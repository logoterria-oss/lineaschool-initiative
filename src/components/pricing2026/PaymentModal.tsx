import { Button } from '@/components/ui/button';
import { formatPrice } from './data';
import type { PaymentTarget } from './usePayment';

type Props = {
  target: PaymentTarget | null;
  lastName: string;
  firstName: string;
  isNameValid: boolean;
  isSubmitting: boolean;
  onLastNameChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function PaymentModal({
  target,
  lastName,
  firstName,
  isNameValid,
  isSubmitting,
  onLastNameChange,
  onFirstNameChange,
  onClose,
  onSubmit,
}: Props) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-1">Подтверждение оплаты</h3>
        <p className="text-sm text-gray-500 mb-4">
          {target.title} — <span className="font-semibold text-gray-900">{formatPrice(target.price)}</span>
        </p>
        <p className="text-gray-600 mb-4">
          Пока мы загружаем платёжную форму, пожалуйста, представьтесь
        </p>

        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Фамилия ребёнка <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Например: Иванов"
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя ребёнка <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Например: Пётр"
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!isNameValid || isSubmitting}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Переходим к оплате…' : 'Оплатить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
