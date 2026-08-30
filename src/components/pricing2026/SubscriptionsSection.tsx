import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Icon from '@/components/ui/icon';
import DiscountRibbon from './DiscountRibbon';
import { formatPrice, pricingSections } from './data';

export default function SubscriptionsSection() {
  const [openSections, setOpenSections] = useState<number[]>([]);

  const toggleSection = (index: number) =>
    setOpenSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );

  return (
    <section className="mb-24">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Рекомендованные абонементы
        </h2>
      </div>

      <div className="space-y-6">
        {pricingSections.map((section, sectionIndex) => {
          const isOpen = openSections.includes(sectionIndex);

          return (
            <div key={section.title} className="border border-gray-200 rounded-xl overflow-hidden">
              <Collapsible open={isOpen}>
                <CollapsibleTrigger
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection(sectionIndex)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                          {section.title}
                        </h3>
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-semibold">
                          {section.subtitle}
                        </span>
                      </div>
                      {Array.isArray(section.description) ? (
                        <ul className="text-gray-600 text-sm sm:text-base space-y-0.5">
                          {section.description.map((line) => (
                            <li key={line} className="flex gap-2">
                              <span className="text-gray-400 flex-shrink-0">—</span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600 text-sm sm:text-base">{section.description}</p>
                      )}
                    </div>
                    <span
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isOpen
                          ? 'bg-green-500 text-white'
                          : 'bg-green-100 text-green-600'
                      }`}
                    >
                      <Icon
                        name={isOpen ? 'ChevronUp' : 'ChevronDown'}
                        size={26}
                        strokeWidth={3}
                      />
                    </span>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="p-6 pt-0 bg-gray-50">
                  <div className="grid md:grid-cols-3 gap-6 pt-4">
                    {section.plans.map((plan) => (
                      <div key={plan.title} className="flex flex-col">
                        <Card
                          className={`relative p-6 flex-1 bg-white transition-all duration-300 hover:shadow-lg ${
                            plan.popular ? 'border-2 border-green-500 shadow-lg' : 'border-gray-200'
                          }`}
                        >
                          {plan.popular && (
                            <div className="absolute -top-3 left-6">
                              <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                Популярный
                              </span>
                            </div>
                          )}
                          {plan.discountPercent && (
                            <DiscountRibbon percent={plan.discountPercent} />
                          )}

                          <div className="text-center flex flex-col h-full">
                            <h4 className="text-xl font-bold text-gray-900 mb-3 mt-2">
                              {plan.title}
                            </h4>

                            <div className="mb-4">
                              <div className="text-3xl font-bold text-gray-900 mb-2">
                                {plan.pricePerLesson.toLocaleString('ru-RU')}&nbsp;₽
                                <span className="text-sm font-normal text-gray-600">/урок</span>
                              </div>
                              <div className="inline-flex items-baseline gap-2 rounded-lg bg-gray-100 px-3 py-1.5">
                                <span className="text-xs text-gray-500">Абонемент</span>
                                <span className="text-sm font-semibold text-gray-800">
                                  {formatPrice(plan.totalPrice)}
                                </span>
                              </div>
                            </div>

                            <div className="bg-green-50 rounded-lg p-4 mb-4 text-left">
                              <h5 className="font-semibold text-gray-800 mb-2 text-sm">
                                Состав курса:
                              </h5>
                              <div className="space-y-1.5 text-xs text-gray-700">
                                <div className="flex items-center">
                                  <Icon
                                    name="Users"
                                    size={12}
                                    className="text-blue-500 mr-2 flex-shrink-0"
                                  />
                                  <span>{plan.groupLessons} групповых</span>
                                </div>
                                {plan.individualLessons > 0 && (
                                  <div className="flex items-center">
                                    <Icon
                                      name="User"
                                      size={12}
                                      className="text-green-500 mr-2 flex-shrink-0"
                                    />
                                    <span>{plan.individualLessons} индивидуальных</span>
                                  </div>
                                )}
                                {plan.interimDiagnostics && (
                                  <div className="flex items-center">
                                    <Icon
                                      name="ClipboardCheck"
                                      size={12}
                                      className="text-orange-500 mr-2 flex-shrink-0"
                                    />
                                    <span>
                                      {plan.interimDiagnostics}{' '}
                                      {plan.interimDiagnostics === 1
                                        ? 'промежуточная диагностика'
                                        : 'промежуточные диагностики'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex-grow" />
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })}
      </div>
    </section>
  );
}