import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

const reasons = [
  {
    title: "Разные причины трудностей",
    description: "Дислексия и дисграфия имеют нейробиологические основы, а не связаны с недостатком знаний правил русского языка",
    icon: "Brain",
    color: "bg-red-500"
  },
  {
    title: "Специализированные методы",
    description: "Необходимы нейропсихологические и логопедические техники, а не традиционное объяснение правил",
    icon: "Settings",
    color: "bg-blue-500"
  },
  {
    title: "Понимание механизмов",
    description: "Нужно работать с базовыми процессами: зрительным восприятием, фонематическим слухом, моторикой",
    icon: "Eye",
    color: "bg-green-500"
  },
  {
    title: "Индивидуальный подход",
    description: "Каждый случай уникален и требует персональной диагностики и коррекционной программы",
    icon: "User",
    color: "bg-purple-500"
  }
];

export default function WhyNotTeacherSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Почему учитель русского языка здесь не поможет?
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Дислексия и дисграфия — это не незнание правил орфографии, а особенности работы мозга, 
            которые требуют специального подхода и понимания нейропсихологических процессов
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {reasons.map((reason, index) => (
            <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 p-6 text-center h-full">
              <div className={`w-16 h-16 ${reason.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                <Icon name={reason.icon as any} size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{reason.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{reason.description}</p>
            </Card>
          ))}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Что делает обычный учитель?
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="X" size={14} className="text-red-500" />
                  </div>
                  <span className="text-gray-700">Объясняет правила орфографии и пунктуации</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="X" size={14} className="text-red-500" />
                  </div>
                  <span className="text-gray-700">Заставляет больше читать и писать</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="X" size={14} className="text-red-500" />
                  </div>
                  <span className="text-gray-700">Указывает на ошибки, не объясняя их причины</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Что делаем мы?
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="Check" size={14} className="text-green-500" />
                  </div>
                  <span className="text-gray-700">Развиваем базовые психические функции</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="Check" size={14} className="text-green-500" />
                  </div>
                  <span className="text-gray-700">Используем нейропсихологические методики</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="Check" size={14} className="text-green-500" />
                  </div>
                  <span className="text-gray-700">Работаем с причинами, а не следствиями</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}