import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { formatPrice, individualPlans } from './data';
import type { PaymentTarget } from './usePayment';

type Props = { onPay: (target: PaymentTarget) => void };

const lessonsWord = (count: number) => {
  if (count % 10 === 1 && count % 100 !== 11) return 'урок';
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'урока';
  return 'уроков';
};

export default function IndividualSection({ onPay }: Props) {
  return (
    <section className="mb-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Индивидуальные занятия
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Занятия один на один с педагогом — вся программа подстраивается под ребёнка
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {individualPlans.map((plan) => (
          <div key={plan.lessons} className="flex flex-col">
            <Card
              className={`relative p-6 flex-1 bg-white transition-all duration-300 hover:shadow-lg ${
                plan.popular ? 'border-2 border-green-500 shadow-lg' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Популярный
                  </span>
                </div>
              )}

              <div className="text-center flex flex-col h-full">
                <h4 className="text-xl font-bold text-gray-900 mb-3 mt-2">
                  {plan.lessons} {lessonsWord(plan.lessons)}
                </h4>

                <div className="mb-4">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {plan.pricePerLesson.toLocaleString('ru-RU')}&nbsp;₽
                    <span className="text-sm font-normal text-gray-600">/урок</span>
                  </div>
                  <div className="text-gray-600">
                    Всего: <span className="font-semibold">{formatPrice(plan.totalPrice)}</span>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 text-left">
                  <div className="flex items-center text-xs text-gray-700">
                    <Icon name="User" size={12} className="text-green-500 mr-2 flex-shrink-0" />
                    <span>{plan.lessons} индивидуальных занятий</span>
                  </div>
                </div>

                <div className="flex-grow" />
              </div>
            </Card>

            <Button
              type="button"
              size="sm"
              className={`w-full mt-4 ${
                plan.popular
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-white border-2 border-green-500 text-green-600 hover:bg-green-50'
              }`}
              onClick={() =>
                onPay({
                  title: `Индивидуальные занятия — ${plan.lessons} ${lessonsWord(plan.lessons)}`,
                  price: plan.totalPrice,
                })
              }
            >
              Выбрать пакет
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
