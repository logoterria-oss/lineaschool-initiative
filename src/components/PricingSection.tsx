import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

const pricingPlans = [
  {
    title: "1 месяц",
    subtitle: "Базовый тариф",
    totalLessons: 16,
    pricePerLesson: "1 380 ₽",
    totalPrice: "22 080 ₽",
    lessons: [
      "4 индивидуальных занятия с логопедом",
      "4 индивидуальных занятия с нейропсихологом", 
      "8 групповых занятий"
    ],
    features: [
      "Первичная диагностика",
      "Индивидуальный план занятий",
      "Методические материалы",
      "Поддержка в чате"
    ]
  },
  {
    title: "3 месяца",
    subtitle: "Оптимальный выбор",
    totalLessons: 54,
    pricePerLesson: "1 170 ₽",
    totalPrice: "63 180 ₽",
    lessons: [
      "12 индивидуальных занятий с логопедом",
      "12 индивидуальных занятий с нейропсихологом",
      "24 групповых занятия"
    ],
    features: [
      "Углубленная диагностика",
      "Персональный куратор",
      "Промежуточные отчеты",
      "Консультации для родителей"
    ],
    popular: true,
    discount: "Экономия 15%"
  },
  {
    title: "6 месяцев",
    subtitle: "Максимальный результат",
    totalLessons: 96,
    pricePerLesson: "970 ₽",
    totalPrice: "93 120 ₽",
    lessons: [
      "24 индивидуальных занятия с логопедом",
      "24 индивидуальных занятия с нейропсихологом",
      "48 групповых занятий"
    ],
    features: [
      "Комплексная диагностика",
      "Персональный куратор",
      "Ежемесячные отчеты",
      "Гарантия результата"
    ],
    discount: "Экономия 30%"
  }
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Стоимость занятий</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Выберите удобный тариф для вашего ребёнка
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <Card key={index} className={`relative p-8 ${plan.popular ? 'border-2 border-green-500 bg-white shadow-xl scale-105' : 'border-green-100 bg-white'} hover:shadow-lg transition-all duration-300`}>
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
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.title}</h3>
                <p className="text-green-600 font-medium mb-6">{plan.subtitle}</p>
                
                <div className="mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {plan.pricePerLesson}
                    <span className="text-lg font-normal text-gray-600">/урок</span>
                  </div>
                  <div className="text-gray-600">
                    Всего: <span className="font-semibold">{plan.totalPrice}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {plan.totalLessons} занятий
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Состав курса:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {plan.lessons.map((lesson, lIndex) => (
                      <li key={lIndex} className="flex items-center text-left">
                        <Icon name="Clock" size={14} className="text-green-500 mr-2 flex-shrink-0" />
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <ul className="space-y-3 mb-8 text-left">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center">
                      <Icon name="Check" size={16} className="text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white border-2 border-green-500 text-green-600 hover:bg-green-50'}`}
                  size="lg"
                >
                  Выбрать тариф
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Не знаете, какой тариф выбрать? Запишитесь на бесплатную консультацию
          </p>
          <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
            <Icon name="MessageCircle" className="mr-2" size={20} />
            Получить консультацию
          </Button>
        </div>
      </div>
    </section>
  );
}