import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { formatPrice, individualPlans } from './data';

const lessonsWord = (count: number) => {
  if (count % 10 === 1 && count % 100 !== 11) return 'урок';
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'урока';
  return 'уроков';
};

export default function IndividualSection() {
  return (
    <section className="mb-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Индивидуальные занятия
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Рекомендуется детям с тяжёлой речевой, оптико-моторной и мнестической симптоматикой,
          когда занятия в группах невозможны:
        </p>
        <ul className="text-gray-600 text-sm sm:text-base max-w-3xl mx-auto mt-3 space-y-1 text-left inline-block">
          {[
            'Заметные трудности в припоминании букв при письме и чтении',
            'Побуквенное чтение после 9 лет',
            'Стойкое зеркальное написание букв',
            'Грубое нарушение языкового анализа на уровне звуков, слов и предложений',
          ].map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-gray-400 flex-shrink-0">—</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
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
          </div>
        ))}
      </div>
    </section>
  );
}