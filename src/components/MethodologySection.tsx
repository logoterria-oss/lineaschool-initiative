import { Card, CardContent } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

export default function MethodologySection() {
  const BrainSVG = ({ activeAreas, className = "" }: { activeAreas: string[], className?: string }) => (
    <svg className={`w-full h-full ${className}`} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Основа мозга */}
      <path
        d="M50 80C50 60 65 40 90 35C110 30 130 35 150 45C170 55 180 75 175 95C170 115 155 130 135 135C115 140 95 135 75 125C55 115 50 100 50 80Z"
        fill={activeAreas.includes('base') ? '#3B82F6' : '#E5E7EB'}
        className="transition-colors duration-300"
      />
      
      {/* Лобная доля */}
      <path
        d="M55 70C55 55 70 45 85 45C100 45 110 55 110 70C110 85 95 95 80 95C65 95 55 85 55 70Z"
        fill={activeAreas.includes('frontal') ? '#10B981' : '#F3F4F6'}
        stroke="#9CA3AF"
        strokeWidth="1"
        className="transition-colors duration-300"
      />
      
      {/* Теменная доля */}
      <path
        d="M110 60C110 50 120 40 135 40C150 40 160 50 160 60C160 70 150 80 135 80C120 80 110 70 110 60Z"
        fill={activeAreas.includes('parietal') ? '#8B5CF6' : '#F3F4F6'}
        stroke="#9CA3AF"
        strokeWidth="1"
        className="transition-colors duration-300"
      />
      
      {/* Височная доля */}
      <path
        d="M80 100C80 90 90 85 105 85C120 85 130 90 130 100C130 110 120 115 105 115C90 115 80 110 80 100Z"
        fill={activeAreas.includes('temporal') ? '#F59E0B' : '#F3F4F6'}
        stroke="#9CA3AF"
        strokeWidth="1"
        className="transition-colors duration-300"
      />
      
      {/* Затылочная доля */}
      <path
        d="M140 90C140 80 150 75 165 75C180 75 185 80 185 90C185 100 180 105 165 105C150 105 140 100 140 90Z"
        fill={activeAreas.includes('occipital') ? '#EF4444' : '#F3F4F6'}
        stroke="#9CA3AF"
        strokeWidth="1"
        className="transition-colors duration-300"
      />
      
      {/* Моторная кора */}
      <path
        d="M90 50C90 45 95 40 105 40C115 40 120 45 120 50C120 55 115 60 105 60C95 60 90 55 90 50Z"
        fill={activeAreas.includes('motor') ? '#06B6D4' : '#F3F4F6'}
        stroke="#9CA3AF"
        strokeWidth="1"
        className="transition-colors duration-300"
      />
    </svg>
  );

  const WeekSchedule = () => (
    <div className="bg-white rounded-2xl p-8 shadow-lg">
      <h3 className="text-xl font-bold text-center mb-6">Расписание на неделю</h3>
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map((day, index) => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {[
          { type: 'group', label: 'Группа', color: 'bg-blue-500' },
          { type: 'individual-neuro', label: 'Нейро', color: 'bg-purple-500' },
          { type: 'group', label: 'Группа', color: 'bg-blue-500' },
          { type: 'individual-speech', label: 'Лого', color: 'bg-green-500' },
          { type: 'rest', label: '', color: 'bg-gray-100' },
          { type: 'rest', label: '', color: 'bg-gray-100' },
          { type: 'rest', label: '', color: 'bg-gray-100' }
        ].map((session, index) => (
          <div key={index} className={`${session.color} rounded-lg p-3 text-center`}>
            <div className="text-white text-xs font-medium">{session.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Уникальная методика
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Научно обоснованный подход к коррекции дислексии и дисграфии
          </p>
        </div>

        {/* Расписание */}
        <div className="mb-16 max-w-2xl mx-auto">
          <WeekSchedule />
        </div>

        {/* Основные типы занятий */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Групповые занятия */}
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Icon name="Users" size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Групповые занятия</h3>
              <div className="text-blue-100 font-semibold mb-4">2 раза в неделю</div>
              <p className="text-blue-50 leading-relaxed mb-6">
                Отрабатываем новые умения на практике и превращаем их в навыки
              </p>
              <div className="h-32">
                <BrainSVG activeAreas={['frontal', 'parietal']} />
              </div>
              <div className="mt-4 text-sm text-blue-100">
                <strong>Активные области:</strong> лобная и теменная доли
              </div>
            </CardContent>
          </Card>

          {/* Нейропсихолог */}
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Icon name="Brain" size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Нейропсихолог</h3>
              <div className="text-purple-100 font-semibold mb-4">1 раз в неделю</div>
              <div className="text-purple-50 leading-relaxed mb-6 space-y-2">
                <div>• Сукцессивное восприятие</div>
                <div>• Симультанное восприятие</div>
                <div>• Оптико-моторный компонент</div>
              </div>
              <div className="h-32">
                <BrainSVG activeAreas={['occipital', 'parietal', 'motor']} />
              </div>
              <div className="mt-4 text-sm text-purple-100">
                <strong>Активные области:</strong> затылочная, теменная доли, моторная кора
              </div>
            </CardContent>
          </Card>

          {/* Логопед */}
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Icon name="MessageCircle" size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Логопед</h3>
              <div className="text-green-100 font-semibold mb-4">1 раз в неделю</div>
              <div className="text-green-50 leading-relaxed mb-6 space-y-2">
                <div>• Фонематические процессы</div>
                <div>• Слоговый анализ</div>
                <div>• Языковой анализ</div>
              </div>
              <div className="h-32">
                <BrainSVG activeAreas={['temporal', 'frontal']} />
              </div>
              <div className="mt-4 text-sm text-green-100">
                <strong>Активные области:</strong> височная и лобная доли
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Детальная инфографика навыков */}
        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Развиваемые навыки и области мозга
          </h3>
          
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
                  Теменная и затылочная доли
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Симультанное восприятие</h4>
                <p className="text-gray-600 mb-3">
                  Целостное восприятие - навык, необходимый для беглого чтения не по слогам, а целыми словами и фразами
                </p>
                <div className="flex items-center text-sm text-blue-600">
                  <Icon name="MapPin" size={16} className="mr-2" />
                  Затылочная и теменная доли
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
              <div className="h-80">
                <BrainSVG activeAreas={['frontal', 'parietal', 'temporal', 'occipital', 'motor']} />
              </div>
              
              {/* Легенда */}
              <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                  Лобная доля
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                  Теменная доля
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
                  Височная доля
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                  Затылочная доля
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-cyan-500 rounded mr-2"></div>
                  Моторная кора
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Результат */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-green-500 to-blue-500 px-8 py-4 rounded-2xl text-white shadow-lg">
            <Icon name="Target" size={24} />
            <span className="text-lg font-bold">4 занятия в неделю = Комплексное развитие всех областей мозга</span>
            <Icon name="Brain" size={24} />
          </div>
        </div>
      </div>
    </section>
  );
}