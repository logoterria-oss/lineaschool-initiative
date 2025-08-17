import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

const services = [
  {
    title: "Углубленная диагностика",
    description: "Комплексное обследование для выявления механизма нарушения",
    icon: "Search"
  },
  {
    title: "Индивидуальные занятия",
    description: "Персональная работа с логопедом и нейропсихологом по узконаправленным задачам",
    icon: "FileText"
  },
  {
    title: "Групповые занятия",
    description: "Занятия в малых группах для коррекции регуляторных трудностей и взаимного обучения",
    icon: "BookOpen"
  },
  {
    title: "Консультации для родителей",
    description: "Обучение родителей методам поддержки ребёнка дома",
    icon: "Video"
  }
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Наши услуги</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Комплексный подход к коррекции дислексии и дисграфии
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="bg-white border-green-100 hover:shadow-lg transition-all duration-300 hover:scale-105 p-6 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name={service.icon as any} size={24} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{service.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}