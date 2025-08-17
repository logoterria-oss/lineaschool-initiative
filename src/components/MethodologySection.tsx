import { Card, CardContent } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

export default function MethodologySection() {
  const methodSteps = [
    {
      title: "Групповые занятия",
      frequency: "2 раза в неделю",
      icon: "Users",
      description: "Отрабатываем новые умения на практике и превращаем их в навыки",
      color: "bg-blue-500"
    },
    {
      title: "Индивидуальные с логопедом",
      frequency: "1 раз в неделю",
      icon: "MessageCircle",
      description: "Работаем над фонематическими процессами, слоговым и языковым анализом",
      color: "bg-green-500"
    },
    {
      title: "Индивидуальные с нейропсихологом",
      frequency: "1 раз в неделю",
      icon: "Brain",
      description: "Развиваем сукцессивное и симультанное восприятие, оптико-моторный компонент",
      color: "bg-purple-500"
    }
  ];

  const skills = [
    {
      title: "Сукцессивное восприятие",
      description: "Последовательное восприятие - навык, необходимый для того, чтобы буквы и слоги не «путались» при письме и чтении",
      icon: "ArrowRight"
    },
    {
      title: "Симультанное восприятие",
      description: "Целостное восприятие - навык, необходимый для беглого чтения не по слогам, а целыми словами и фразами",
      icon: "Eye"
    },
    {
      title: "Оптико-моторный компонент",
      description: "Необходим для правильного написания букв и разборчивого почерка",
      icon: "PenTool"
    },
    {
      title: "Фонематические процессы",
      description: "Умение слышать, различать и анализировать звуки речи",
      icon: "Volume2"
    },
    {
      title: "Слоговый и языковой анализ",
      description: "Анализ последовательности букв, слогов, слов и предложений, видеть их границы",
      icon: "FileText"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Уникальная методика
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Комплексный подход с занятиями 4 раза в неделю для максимального результата
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {methodSteps.map((step, index) => (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <Icon name={step.icon} size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <div className="text-sm font-semibold text-green-600 mb-4">{step.frequency}</div>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Ключевые навыки, которые мы развиваем
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Icon name={skill.icon} size={20} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{skill.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{skill.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 bg-green-100 px-6 py-3 rounded-full">
            <Icon name="Calendar" size={20} className="text-green-600" />
            <span className="font-semibold text-green-800">4 занятия в неделю = Быстрый результат</span>
          </div>
        </div>
      </div>
    </section>
  );
}