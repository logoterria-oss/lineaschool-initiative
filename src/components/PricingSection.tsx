import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Icon from "@/components/ui/icon";
import BookingModal from "@/components/BookingModal";

const pricingData = [
  {
    title: "2 урока в неделю",
    description: "Размеренный темп обучения",
    plans: [
      {
        title: "1 месяц",
        totalLessons: 8,
        groupLessons: 4,
        individualLessons: 4,
        pricePerLesson: "1 370 ₽",
        totalPrice: "10 960 ₽",
        features: ["Первичная диагностика", "Базовый план занятий"]
      },
      {
        title: "3 месяца",
        totalLessons: 24,
        groupLessons: 12,
        individualLessons: 12,
        pricePerLesson: "1 250 ₽",
        totalPrice: "30 000 ₽",
        features: ["Углубленная диагностика", "Персональный куратор"],
        popular: true,
        discount: "Экономия 9%"
      },
      {
        title: "6 месяцев",
        totalLessons: 48,
        groupLessons: 24,
        individualLessons: 24,
        pricePerLesson: "1 150 ₽",
        totalPrice: "55 200 ₽",
        features: ["Комплексная диагностика", "Гарантия результата"],
        discount: "Экономия 16%"
      }
    ]
  },
  {
    title: "3 урока в неделю",
    description: "Оптимальный темп развития",
    plans: [
      {
        title: "1 месяц",
        totalLessons: 12,
        groupLessons: 8,
        individualLessons: 4,
        pricePerLesson: "1 200 ₽",
        totalPrice: "14 400 ₽",
        features: ["Первичная диагностика", "Базовый план занятий"]
      },
      {
        title: "3 месяца",
        totalLessons: 36,
        groupLessons: 24,
        individualLessons: 12,
        pricePerLesson: "1 100 ₽",
        totalPrice: "39 600 ₽",
        features: ["Углубленная диагностика", "Персональный куратор"],
        popular: true,
        discount: "Экономия 8%"
      },
      {
        title: "6 месяцев",
        totalLessons: 72,
        groupLessons: 48,
        individualLessons: 24,
        pricePerLesson: "1 030 ₽",
        totalPrice: "74 160 ₽",
        features: ["Комплексная диагностика", "Гарантия результата"],
        discount: "Экономия 14%"
      }
    ]
  },
  {
    title: "4 урока в неделю",
    description: "Интенсивное развитие",
    plans: [
      {
        title: "1 месяц",
        totalLessons: 16,
        groupLessons: 8,
        individualLessons: 8,
        pricePerLesson: "1 180 ₽",
        totalPrice: "18 880 ₽",
        features: ["Первичная диагностика", "Интенсивный план"]
      },
      {
        title: "3 месяца",
        totalLessons: 48,
        groupLessons: 24,
        individualLessons: 24,
        pricePerLesson: "1 050 ₽",
        totalPrice: "50 400 ₽",
        features: ["Углубленная диагностика", "Персональный куратор"],
        popular: true,
        discount: "Экономия 11%"
      },
      {
        title: "6 месяцев",
        totalLessons: 96,
        groupLessons: 48,
        individualLessons: 48,
        pricePerLesson: "970 ₽",
        totalPrice: "93 120 ₽",
        features: ["Комплексная диагностика", "Максимальная поддержка"],
        discount: "Экономия 18%"
      }
    ]
  }
];

export default function PricingSection() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [openSections, setOpenSections] = useState<number[]>([0]);

  const toggleSection = (index: number) => {
    setOpenSections(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <>
    <section id="pricing" className="py-4 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Стоимость занятий</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Выберите удобный темп обучения для вашего ребёнка
          </p>
        </div>

        <div className="space-y-8">
          {pricingData.map((section, sectionIndex) => (
            <div key={sectionIndex} className="border border-gray-200 rounded-xl overflow-hidden">
              <Collapsible open={openSections.includes(sectionIndex)}>
                <CollapsibleTrigger 
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection(sectionIndex)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{section.title}</h3>
                      <p className="text-gray-600">{section.description}</p>
                    </div>
                    <Icon 
                      name={openSections.includes(sectionIndex) ? "ChevronUp" : "ChevronDown"} 
                      size={24} 
                      className="text-gray-500"
                    />
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="p-6 pt-0 bg-gray-50">
                  <div className="grid md:grid-cols-3 gap-6">
                    {section.plans.map((plan, planIndex) => (
                      <Card key={planIndex} className={`relative p-6 ${plan.popular ? 'border-2 border-green-500 bg-white shadow-lg scale-105' : 'border-gray-200 bg-white'} hover:shadow-lg transition-all duration-300`}>
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                              Популярный
                            </span>
                          </div>
                        )}
                        {plan.discount && (
                          <div className="absolute top-4 right-4">
                            <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-semibold">
                              {plan.discount}
                            </span>
                          </div>
                        )}
                        
                        <div className="text-center">
                          <h4 className="text-xl font-bold text-gray-900 mb-1">{plan.title}</h4>
                          
                          <div className="mb-4">
                            <div className="text-3xl font-bold text-gray-900 mb-2">
                              {plan.pricePerLesson}
                              <span className="text-sm font-normal text-gray-600">/урок</span>
                            </div>
                            <div className="text-gray-600">
                              Всего: <span className="font-semibold">{plan.totalPrice}</span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {plan.totalLessons} занятий
                            </div>
                          </div>
                          
                          <div className="bg-green-50 rounded-lg p-4 mb-4">
                            <h5 className="font-semibold text-gray-800 mb-2 text-sm">Состав курса:</h5>
                            <div className="space-y-1 text-xs text-gray-700">
                              <div className="flex items-center">
                                <Icon name="Users" size={12} className="text-blue-500 mr-2 flex-shrink-0" />
                                <span>{plan.groupLessons} групповых занятий</span>
                              </div>
                              <div className="flex items-center">
                                <Icon name="User" size={12} className="text-green-500 mr-2 flex-shrink-0" />
                                <span>{plan.individualLessons} индивидуальных занятий</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <ul className="space-y-1 text-xs text-gray-600">
                              {plan.features.map((feature, fIndex) => (
                                <li key={fIndex} className="flex items-center">
                                  <Icon name="Check" size={12} className="text-green-500 mr-2 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <Button 
                            className={`w-full ${plan.popular ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white border-2 border-green-500 text-green-600 hover:bg-green-50'}`}
                            size="sm"
                            onClick={() => setIsBookingModalOpen(true)}
                          >
                            Выбрать тариф
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>
        
        {/* Payment Options */}
        <div className="mt-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Удобные способы оплаты</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Оплачивайте обучение удобным способом — полностью или частями без переплат
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <Icon name="CreditCard" size={24} className="text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-800">Рассрочка от банков-партнеров</h4>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <Icon name="Check" size={16} className="text-green-500 mr-3 flex-shrink-0" />
                  <span>До 12 месяцев без процентов</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <Icon name="Check" size={16} className="text-green-500 mr-3 flex-shrink-0" />
                  <span>Одобрение за 1 минуту</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <Icon name="Check" size={16} className="text-green-500 mr-3 flex-shrink-0" />
                  <span>Минимум документов</span>
                </li>
              </ul>
              <div className="flex items-center justify-center space-x-4">
                <div className="text-sm text-gray-500">Партнеры:</div>
                <div className="flex space-x-2">
                  <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">Тинькофф</div>
                  <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">Сбербанк</div>
                  <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">ВТБ</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                  <Icon name="Wallet" size={24} className="text-purple-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-800">Оплата Долями</h4>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <Icon name="Check" size={16} className="text-green-500 mr-3 flex-shrink-0" />
                  <span>Разделите платеж на 4 части</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <Icon name="Check" size={16} className="text-green-500 mr-3 flex-shrink-0" />
                  <span>Никаких процентов и переплат</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <Icon name="Check" size={16} className="text-green-500 mr-3 flex-shrink-0" />
                  <span>Моментальное одобрение</span>
                </li>
              </ul>
              <div className="text-center">
                <div className="inline-flex items-center bg-purple-50 px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-purple-700">Оплачивайте частями без лишних трат</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Icon name="Shield" size={24} className="text-green-500" />
              <span className="text-lg font-semibold text-gray-800">Безопасные платежи</span>
            </div>
            <p className="text-gray-600 text-sm">
              Все платежи защищены банковским шифрованием. Мы не храним данные ваших карт.
            </p>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Не знаете, какой тариф выбрать? Запишитесь на бесплатную консультацию
          </p>
          <Button 
            variant="outline" 
            className="border-green-500 text-green-600 hover:bg-green-50"
            onClick={() => setIsBookingModalOpen(true)}
          >
            <Icon name="MessageCircle" className="mr-2" size={20} />
            Получить консультацию
          </Button>
        </div>
      </div>
    </section>

    <BookingModal 
      isOpen={isBookingModalOpen} 
      onClose={() => setIsBookingModalOpen(false)} 
    />
    </>
  );
}