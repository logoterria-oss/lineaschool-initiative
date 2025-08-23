import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

const diagnosticSteps = [
  {
    title: "Знакомство с ребёнком",
    description: "Создание доверительной атмосферы и психологического контакта с учеником",
    icon: "Heart",
    color: "bg-blue-500"
  },
  {
    title: "Тестирование навыков",
    description: "Определение уровня чтения, письма и понимания текста с помощью специальных заданий",
    icon: "ClipboardCheck",
    color: "bg-green-500"
  },
  {
    title: "Анализ ошибок",
    description: "Выявление типичных ошибок и определение механизмов нарушения",
    icon: "Target",
    color: "bg-orange-500"
  },
  {
    title: "Рекомендации родителям",
    description: "Подробный разбор результатов и составление индивидуального плана коррекции",
    icon: "MessageCircle",
    color: "bg-purple-500"
  }
];

export default function DiagnosticSection() {
  return (
    <section id="diagnostic" className="py-20 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Что будет на бесплатной диагностике?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            60-минутная онлайн-консультация для точного выявления особенностей развития вашего ребёнка
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {diagnosticSteps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 p-8 text-center h-full">
                <div className="relative mb-6">
                  <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <Icon name={step.icon as any} size={28} className="text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                    <span className="text-sm font-bold text-gray-700">{index + 1}</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
              </Card>
              
              {/* Connecting line for desktop */}
              {index < diagnosticSteps.length - 1 && (
                <div className="hidden lg:block absolute top-16 -right-4 w-8 h-0.5 bg-gradient-to-r from-gray-300 to-gray-200"></div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg border border-white/50">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              После диагностики вы получите:
            </h3>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name="Check" size={16} className="text-white" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800 mb-1">Детальный анализ</h4>
                  <p className="text-sm text-gray-600">Письменное заключение с описанием всех особенностей</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name="Check" size={16} className="text-white" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800 mb-1">План коррекции</h4>
                  <p className="text-sm text-gray-600">Индивидуальные рекомендации и упражнения</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name="Check" size={16} className="text-white" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800 mb-1">Дальнейшие шаги</h4>
                  <p className="text-sm text-gray-600">Четкий алгоритм действий для родителей</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}