import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Icon from "@/components/ui/icon";
import BookingModal from "@/components/BookingModal";

declare global {
  interface Window {
    PaymentIntegration?: any;
  }
}

const pricingData = [
  {
    title: "2 урока в неделю",
    description: "Легкая степень выраженности дислексии/дисграфии",
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
        discount: "Экономия 9%",
        paymentOptions: [
          {
            type: "dolami",
            icon: "https://cdn.poehali.dev/files/27ce158f-0959-4d8e-b037-1fef96c64630.png",
            text: "оплата Долями"
          }
        ]
      },
      {
        title: "6 месяцев",
        totalLessons: 48,
        groupLessons: 24,
        individualLessons: 24,
        pricePerLesson: "1 150 ₽",
        totalPrice: "55 200 ₽",
        features: ["Комплексная диагностика", "Гарантия результата"],
        discount: "Экономия 16%",
        paymentOptions: [
          {
            type: "dolami",
            icon: "https://cdn.poehali.dev/files/27ce158f-0959-4d8e-b037-1fef96c64630.png",
            text: "оплата Долями"
          },
          {
            type: "installment",
            text: "рассрочка от банков"
          }
        ]
      }
    ]
  },
  {
    title: "3 урока в неделю",
    description: "Средняя степень выраженности дислексии/дисграфии",
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
        discount: "Экономия 8%",
        paymentOptions: [
          {
            type: "dolami",
            icon: "https://cdn.poehali.dev/files/27ce158f-0959-4d8e-b037-1fef96c64630.png",
            text: "оплата Долями"
          }
        ]
      },
      {
        title: "6 месяцев",
        totalLessons: 72,
        groupLessons: 48,
        individualLessons: 24,
        pricePerLesson: "1 030 ₽",
        totalPrice: "74 160 ₽",
        features: ["Комплексная диагностика", "Гарантия результата"],
        discount: "Экономия 14%",
        paymentOptions: [
          {
            type: "dolami",
            icon: "https://cdn.poehali.dev/files/27ce158f-0959-4d8e-b037-1fef96c64630.png",
            text: "оплата Долями"
          },
          {
            type: "installment",
            text: "рассрочка от банков"
          }
        ]
      }
    ]
  },
  {
    title: "4 урока в неделю",
    description: "Тяжелая степень выраженности дислексии/дисграфии",
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
        discount: "Экономия 11%",
        paymentOptions: [
          {
            type: "dolami",
            icon: "https://cdn.poehali.dev/files/27ce158f-0959-4d8e-b037-1fef96c64630.png",
            text: "оплата Долями"
          }
        ]
      },
      {
        title: "6 месяцев",
        totalLessons: 96,
        groupLessons: 48,
        individualLessons: 48,
        pricePerLesson: "970 ₽",
        totalPrice: "93 120 ₽",
        features: ["Комплексная диагностика", "Максимальная поддержка"],
        discount: "Экономия 18%",
        paymentOptions: [
          {
            type: "dolami",
            icon: "https://cdn.poehali.dev/files/27ce158f-0959-4d8e-b037-1fef96c64630.png",
            text: "оплата Долями"
          },
          {
            type: "installment",
            text: "рассрочка от банков"
          }
        ]
      }
    ]
  }
];

export default function PricingSection() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [openSections, setOpenSections] = useState<number[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedSectionTitle, setSelectedSectionTitle] = useState<string>('');
  const [clientName, setClientName] = useState('');

  const toggleSection = (index: number) => {
    setOpenSections(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const openPaymentModal = (plan: any, sectionTitle: string) => {
    setSelectedPlan(plan);
    setSelectedSectionTitle(sectionTitle);
    setIsPaymentModalOpen(true);
  };

  const handlePayment = async () => {
    if (!clientName || !selectedPlan) return;
    
    const amount = parseInt(selectedPlan.totalPrice.replace(/\s/g, '').replace('₽', '')) * 100;
    const description = `${selectedSectionTitle} - ${selectedPlan.title}`;
    const orderId = `ORDER_${Date.now()}`;
    
    console.log('Initiating payment:', { amount, description, orderId, name: clientName });
    
    try {
      // Сохраняем данные клиента в БД
      await fetch('https://functions.poehali.dev/99e752b7-e754-4be4-8fe8-1b666731a12c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: clientName,
          plan: `${selectedSectionTitle} - ${selectedPlan.title}`,
          amount: amount / 100,
          order_id: orderId
        })
      });

      const response = await fetch('https://functions.poehali.dev/9f468e7d-1f22-4bde-8030-cd12879879e5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          order: orderId,
          description,
          receipt: {
            Email: 'info@lineaschool.ru',
            Taxation: 'usn_income',
            FfdVersion: '1.2',
            Items: [
              {
                Name: description,
                Price: amount,
                Quantity: 1,
                Amount: amount,
                Tax: 'none',
                PaymentMethod: 'full_prepayment',
                PaymentObject: 'service',
                MeasurementUnit: 'pc'
              }
            ]
          }
        })
      });
      
      const result = await response.json();
      console.log('Payment init result:', result);
      
      if (result.PaymentURL) {
        window.location.href = result.PaymentURL;
      } else {
        alert(`Ошибка: ${result.error || 'Не удалось создать платёж'}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ошибка при создании платежа. Попробуйте позже.');
    }
  };

  return (
    <>
    <section id="pricing" className="py-4 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
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
                      <div key={planIndex} className="flex flex-col">
                      <Card className={`relative p-6 flex-1 ${plan.popular ? 'border-2 border-green-500 bg-white shadow-lg scale-105' : 'border-gray-200 bg-white'} hover:shadow-lg transition-all duration-300`}>
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
                        
                        <div className="text-center flex flex-col h-full">
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
                              <div className="flex items-center text-left">
                                <Icon name="Users" size={12} className="text-blue-500 mr-2 flex-shrink-0" />
                                <span>{plan.groupLessons} групповых занятий</span>
                              </div>
                              <div className="flex items-center text-left">
                                <Icon name="User" size={12} className="text-green-500 mr-2 flex-shrink-0" />
                                <span>{plan.individualLessons} индивидуальных занятий</span>
                              </div>
                            </div>
                          </div>
                          
                          {plan.paymentOptions && (
                            <div className="mb-4 space-y-1">
                              {plan.paymentOptions.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center text-left">
                                  {option.icon ? (
                                    <div className="w-4 h-4 mr-2 flex-shrink-0 overflow-hidden rounded-sm">
                                      <img 
                                        src={option.icon} 
                                        alt={option.text}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex mr-2 flex-shrink-0 gap-1">
                                      <div className="w-4 h-4 overflow-hidden rounded-sm">
                                        <img 
                                          src="https://cdn.poehali.dev/files/c70fd8e5-616d-43e1-ae1f-94f4c0208549.jpg" 
                                          alt="ТБанк"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="w-4 h-4 overflow-hidden rounded-sm">
                                        <img 
                                          src="https://cdn.poehali.dev/files/4f1976b5-f535-425b-a9b0-78c4b35b9e62.png" 
                                          alt="МТС Банк"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-600">{option.text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex-grow"></div>
                        </div>
                      </Card>
                      
                      <Button 
                        type="button"
                        className={`w-full mt-4 ${plan.popular ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white border-2 border-green-500 text-green-600 hover:bg-green-50'}`}
                        size="sm"
                        onClick={(e) => {
                          console.log('Button clicked - payment');
                          e.preventDefault();
                          e.stopPropagation();
                          openPaymentModal(plan, section.title);
                        }}
                      >
                        Выбрать тариф
                      </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
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

    {isPaymentModalOpen && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold mb-4">Подтверждение оплаты</h3>
          <p className="text-gray-600 mb-4">
            Пока мы загружаем платёжную форму, пожалуйста, представьтесь
          </p>
          <input
            type="text"
            placeholder="Введите ФИО ребенка"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsPaymentModalOpen(false);
                setClientName('');
              }}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handlePayment}
              disabled={!clientName || clientName.length < 2}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Оплатить
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}