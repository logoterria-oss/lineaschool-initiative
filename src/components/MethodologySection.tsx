import { Card, CardContent } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

export default function MethodologySection() {
  const BrainSVG = ({ activeAreas, className = "" }: { activeAreas: string[], className?: string }) => (
    <div className={`relative w-full h-full ${className}`}>
      <img 
        src="https://cdn.poehali.dev/files/ad7329c2-cb17-47cb-937a-0c559565286f.jpg" 
        alt="Анатомическая схема мозга" 
        className="w-full h-full object-contain"
        style={{
          background: 'transparent',
          mixBlendMode: 'multiply',
          filter: 'brightness(1.1) contrast(1.2)'
        }}
      />
    </div>
  );



  return (
    <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


        {/* Основные типы занятий */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Логопед */}
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Icon name="MessageCircle" size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Логопед:
индивидуальные
занятия</h3>
              <div className="text-green-100 font-semibold mb-4">1 раз в неделю</div>
              <div className="text-green-50 leading-relaxed space-y-2">
                <div>• Фонематические процессы</div>
                <div>• Слоговый анализ</div>
                <div>• Языковой анализ</div>
              </div>
            </CardContent>
          </Card>

          {/* Нейропсихолог */}
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Icon name="Brain" size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Нейропсихолог: индивидуальные
занятия</h3>
              <div className="text-purple-100 font-semibold mb-4">1 раз в неделю</div>
              <div className="text-purple-50 leading-relaxed space-y-2">
                <div>• Сукцессивное восприятие</div>
                <div>• Симультанное восприятие</div>
                <div>• Оптико-моторный компонент</div>
              </div>
            </CardContent>
          </Card>

          {/* Групповые занятия */}
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Icon name="Users" size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-6 h-16 flex items-center">Групповые занятия</h3>
              <div className="text-blue-100 font-semibold mb-8">2 раза в неделю</div>
              <p className="text-blue-50 leading-relaxed">
                Отрабатываем новые умения на практике и превращаем их в навыки
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Детальная инфографика навыков */}
        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl mb-16">

          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Левая колонка - навыки */}
            <div className="space-y-8">
              <div className="border-l-4 border-purple-500 pl-6">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Сукцессивное восприятие</h4>
                <p className="text-gray-600 mb-3">
                  Последовательное восприятие - навык, необходимый для того, чтобы буквы и слоги не "путались" при письме и чтении
                </p>
                <div className="flex items-center text-sm text-purple-600">
                  <Icon name="MapPin" size={16} className="mr-2" />
                  Лобные доли
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Симультанное восприятие</h4>
                <p className="text-gray-600 mb-3">
                  Целостное восприятие - навык, необходимый для беглого чтения не по слогам, а целыми словами и фразами
                </p>
                <div className="flex items-center text-sm text-blue-600">
                  <Icon name="MapPin" size={16} className="mr-2" />
                  Теменные доли
                </div>
              </div>

              <div className="border-l-4 border-cyan-500 pl-6">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Оптико-моторный компонент</h4>
                <p className="text-gray-600 mb-3">
                  Необходим для правильного написания букв и разборчивого почерка
                </p>
                <div className="flex items-center text-sm text-cyan-600">
                  <Icon name="MapPin" size={16} className="mr-2" />
                  Моторная кора, теменная доля
                </div>
              </div>

              <div className="border-l-4 border-orange-500 pl-6">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Фонематические процессы</h4>
                <p className="text-gray-600 mb-3">
                  Умение слышать, различать и анализировать звуки речи
                </p>
                <div className="flex items-center text-sm text-orange-600">
                  <Icon name="MapPin" size={16} className="mr-2" />
                  Височная доля
                </div>
              </div>

              <div className="border-l-4 border-green-500 pl-6">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Слоговый и языковой анализ</h4>
                <p className="text-gray-600 mb-3">
                  Анализ последовательности букв, слогов, слов и предложений, видеть их границы
                </p>
                <div className="flex items-center text-sm text-green-600">
                  <Icon name="MapPin" size={16} className="mr-2" />
                  Лобная и височная доли
                </div>
              </div>
            </div>

            {/* Правая колонка - большая схема мозга */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <h4 className="text-lg font-bold text-center mb-6">Карта активности мозга</h4>
              <div className="h-96">
                <BrainSVG activeAreas={['frontal', 'parietal', 'temporal', 'occipital', 'motor']} />
              </div>
              
              {/* Легенда */}
              <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-pink-300 rounded mr-2"></div>
                  Лобная доля
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded mr-2"></div>
                  Теменная доля
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                  Височная доля
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                  Затылочная доля
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-cyan-500 rounded mr-2"></div>
                  Первичная моторная кора
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Результат */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-green-500 to-blue-500 px-8 py-4 rounded-2xl text-white shadow-lg">
            <Icon name="Target" size={24} />
            <span className="text-lg font-bold">4 занятия в неделю = комплексное развитие всех областей мозга</span>
            <Icon name="Brain" size={24} />
          </div>
        </div>
      </div>
    </section>
  );
}