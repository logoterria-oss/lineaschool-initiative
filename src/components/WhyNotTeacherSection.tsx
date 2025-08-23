import Icon from "@/components/ui/icon";

const comparisons = [
  {
    category: "Понимание проблемы",
    teacher: "Считает, что ребенок ленивый или невнимательный",
    specialist: "Понимает нейробиологическую природу дислексии и дисграфии"
  },
  {
    category: "Методы работы",
    teacher: "Объясняет правила орфографии и заставляет их заучивать",
    specialist: "Развивает высшие психические функции через нейрологопедические упражнения"
  },
  {
    category: "Подход к ошибкам",
    teacher: "Указывает на ошибки и требует их исправления",
    specialist: "Анализирует причины ошибок и работает с механизмами их возникновения"
  },
  {
    category: "Диагностика",
    teacher: "Оценивает только знание правил и грамотность",
    specialist: "Проводит комплексную нейрологопедическую диагностику"
  },
  {
    category: "Результат",
    teacher: "Часто усугубляет проблему и снижает самооценку ребенка",
    specialist: "Системно улучшает навыки чтения и письма, повышает уверенность"
  }
];

export default function WhyNotTeacherSection() {
  return (
    <section className="py-20 bg-white">
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

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="col-span-4 p-6">
              <h3 className="text-xl font-bold text-gray-800">Аспект работы</h3>
            </div>
            <div className="col-span-4 p-6 bg-red-50 border-l border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <Icon name="GraduationCap" size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-700">Учитель русского
языка</h3>

                </div>
              </div>
            </div>
            <div className="col-span-4 p-6 bg-green-50 border-l border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Icon name="Brain" size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-700">Логопед-
нейропсихолог</h3>

                </div>
              </div>
            </div>
          </div>

          {/* Comparison rows */}
          {comparisons.map((comparison, index) => (
            <div key={index} className={`grid grid-cols-12 ${index % 2 === 0 ? 'bg-white/50' : 'bg-gray-50/50'} border-b border-gray-200 last:border-b-0`}>
              <div className="col-span-4 p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">{comparison.category}</h4>
              </div>
              
              <div className="col-span-4 p-6 border-l border-gray-200 relative">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Icon name="X" size={14} className="text-red-500" />
                  </div>
                  <p className="text-gray-700 leading-relaxed">{comparison.teacher}</p>
                </div>
              </div>
              
              {/* Arrow */}
              <div className="col-span-4 p-6 border-l border-gray-200 relative">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Icon name="ArrowRight" size={16} className="text-white" />
                  </div>
                </div>
                <div className="flex items-start space-x-3 ml-4">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Icon name="Check" size={14} className="text-green-500" />
                  </div>
                  <p className="text-gray-700 leading-relaxed">{comparison.specialist}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Важно понимать разницу!
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Работа с дислексией и дисграфией требует глубоких знаний в области логопедии и нейропсихологии, а также специализированных методик коррекции
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Icon name="Lightbulb" size={24} className="text-yellow-500" />
              <span className="text-gray-700 font-medium">
                Поэтому так важно обратиться к профильному специалисту
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}