import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Icon from '@/components/ui/icon';
import { formatPrice, individualIndications, individualPlans } from './data';

const lessonsWord = (count: number) => {
  if (count % 10 === 1 && count % 100 !== 11) return 'урок';
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'урока';
  return 'уроков';
};

export default function IndividualSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="mb-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Индивидуальные занятия</h2>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <Collapsible open={isOpen}>
          <CollapsibleTrigger
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen((v) => !v)}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Один на один</h3>
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-semibold">
                    8, 12 или 16 уроков
                  </span>
                </div>

                <p className="text-gray-600 text-sm sm:text-base mb-2">
                  {individualIndications.intro}:
                </p>

                <ul className="text-gray-600 text-sm sm:text-base space-y-0.5">
                  {individualIndications.signs.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="text-gray-400 flex-shrink-0">—</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <span
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isOpen ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600'
                }`}
              >
                <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={26} strokeWidth={3} />
              </span>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="p-6 pt-0 bg-gray-50">
            <div>
              <div className="grid md:grid-cols-3 gap-6 pt-4">
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
                            Всего:{' '}
                            <span className="font-semibold">{formatPrice(plan.totalPrice)}</span>
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4 text-left">
                          <div className="flex items-center text-xs text-gray-700">
                            <Icon
                              name="User"
                              size={12}
                              className="text-green-500 mr-2 flex-shrink-0"
                            />
                            <span>{plan.lessons} индивидуальных занятий</span>
                          </div>
                        </div>

                        <div className="flex-grow" />
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </section>
  );
}