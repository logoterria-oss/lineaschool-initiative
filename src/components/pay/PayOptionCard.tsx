import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import DiscountRibbon from '@/components/pricing2026/DiscountRibbon';
import { formatPrice } from '@/components/pricing2026/data';
import type { PayOption } from './offers';

type Props = {
  option: PayOption;
  isSelected: boolean;
  /** Единственный вариант показываем без выбора — просто карточкой услуги. */
  selectable: boolean;
  onSelect: () => void;
};

export default function PayOptionCard({ option, isSelected, selectable, onSelect }: Props) {
  return (
    <Card
      onClick={selectable ? onSelect : undefined}
      className={`relative p-6 bg-white transition-all duration-200 ${
        selectable ? 'cursor-pointer hover:shadow-lg' : ''
      } ${
        isSelected && selectable
          ? 'border-2 border-green-500 shadow-lg'
          : 'border border-gray-200'
      }`}
    >
      {option.popular && (
        <div className="absolute -top-3 left-6">
          <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Популярный
          </span>
        </div>
      )}
      {option.discountPercent && <DiscountRibbon percent={option.discountPercent} />}

      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3 mt-2">
          {selectable && (
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'
              }`}
            >
              {isSelected && <Icon name="Check" size={12} className="text-white" />}
            </span>
          )}
          <h3 className="text-xl font-bold text-gray-900">{option.title}</h3>
        </div>

        <div className="mb-4">
          {option.pricePerLesson ? (
            <>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {option.pricePerLesson.toLocaleString('ru-RU')}&nbsp;₽
                <span className="text-sm font-normal text-gray-600">/урок</span>
              </div>
              <div className="inline-flex items-baseline gap-2 rounded-lg bg-gray-100 px-3 py-1.5">
                <span className="text-xs text-gray-500">К оплате</span>
                <span className="text-sm font-semibold text-gray-800">
                  {formatPrice(option.totalPrice)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold text-green-600">
                {formatPrice(option.totalPrice)}
              </span>
              {option.oldPrice && (
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(option.oldPrice)}
                </span>
              )}
            </div>
          )}
        </div>

        {option.details.length > 0 && (
          <div className="bg-green-50 rounded-lg p-4 text-left space-y-1.5">
            {option.details.map((row) => (
              <div key={row.text} className="flex items-center text-xs text-gray-700">
                <Icon
                  name={row.icon}
                  size={12}
                  className={`${row.color} mr-2 flex-shrink-0`}
                  fallback="Check"
                />
                <span>{row.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
