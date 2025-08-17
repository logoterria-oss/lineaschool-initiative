import { Card, CardContent } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

export default function MethodologySection() {
  const BrainSVG = ({ activeAreas, className = "" }: { activeAreas: string[], className?: string }) => (
    <svg className={`w-full h-full ${className}`} viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Контур головы */}
      <ellipse cx="140" cy="100" rx="120" ry="85" fill="#F8F9FA" stroke="#E9ECEF" strokeWidth="2"/>
      
      {/* Контур мозга */}
      <path
        d="M40 100C40 60 70 30 120 25C140 23 160 25 180 30C220 40 240 70 235 100C230 130 200 160 160 165C120 170 80 150 50 120C40 115 40 100 40 100Z"
        fill="#F1F3F4"
        stroke="#DEE2E6"
        strokeWidth="2"
        className="transition-colors duration-300"
      />
      
      {/* Лобная доля */}
      <path
        d="M50 90C50 65 70 45 100 40C125 38 145 45 155 65C160 75 155 90 145 100C135 110 120 115 100 115C80 115 60 105 50 90Z"
        fill={activeAreas.includes('frontal') ? '#10B981' : '#E8F5E8'}
        stroke="#10B981"
        strokeWidth="1.5"
        className="transition-colors duration-300"
      />
      
      {/* Теменная доля */}
      <path
        d="M155 65C155 50 170 40 190 42C210 44 225 55 230 75C235 95 225 110 210 120C195 130 180 125 170 110C160 95 155 80 155 65Z"
        fill={activeAreas.includes('parietal') ? '#8B5CF6' : '#F3E8FF'}
        stroke="#8B5CF6"
        strokeWidth="1.5"
        className="transition-colors duration-300"
      />
      
      {/* Височная доля */}
      <path
        d="M80 115C80 100 95 90 115 92C135 94 150 105 155 125C160 145 150 160 130 165C110 170 95 160 85 145C80 135 80 125 80 115Z"
        fill={activeAreas.includes('temporal') ? '#F59E0B' : '#FEF3C7'}
        stroke="#F59E0B"
        strokeWidth="1.5"
        className="transition-colors duration-300"
      />
      
      {/* Затылочная доля */}
      <path
        d="M170 110C170 95 185 85 205 87C225 89 240 100 235 120C230 140 215 150 195 152C175 154 165 140 165 125C165 118 170 110 170 110Z"
        fill={activeAreas.includes('occipital') ? '#EF4444' : '#FEE2E2'}
        stroke="#EF4444"
        strokeWidth="1.5"
        className="transition-colors duration-300"
      />
      
      {/* Моторная кора (полоска в теменной области) */}
      <path
        d="M140 50C140 45 150 42 165 43C180 44 190 47 195 52C200 57 195 62 180 63C165 64 150 61 145 56C140 55 140 50 140 50Z"
        fill={activeAreas.includes('motor') ? '#06B6D4' : '#E0F7FA'}
        stroke="#06B6D4"
        strokeWidth="1.5"
        className="transition-colors duration-300"
      />
      
      {/* Подписи к отделам */}
      <text x="90" y="75" fontSize="10" fill="#374151" textAnchor="middle" fontWeight="500">Лобная</text>
      <text x="90" y="85" fontSize="10" fill="#374151" textAnchor="middle" fontWeight="500">доля</text>
      
      <text x="195" y="80" fontSize="10" fill="#374151" textAnchor="middle" fontWeight="500">Теменная</text>
      <text x="195" y="90" fontSize="10" fill="#374151" textAnchor="middle" fontWeight="500">доля</text>
      
      <text x="120" y="145" fontSize="10" fill="#374151" textAnchor="middle" fontWeight="500">Височная</text>
      <text x="120" y="155" fontSize="10" fill="#374151" textAnchor="middle" fontWeight="500">доля</text>
      
      <text x="205" y="135" fontSize="10" fill="#374151" textAnchor="middle" fontWeight="500">Затылочная</text>
      <text x="205" y="145" fontSize="10" fill="#374151" textAnchor="middle" fontWeight="500">доля</text>
      
      <text x="170" y="40" fontSize="10" fill="#374151" textAnchor="middle" fontWeight="500">Моторная кора</text>
      
      {/* Соединительные линии */}
      <line x1="90" y1="90" x2="110" y2="80" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="2,2"/>
      <line x1="195" y1="95" x2="180" y2="85" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="2,2"/>
      <line x1="120" y1="140" x2="125" y2="125" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="2,2"/>
      <line x1="205" y1="130" x2="195" y2="125" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="2,2"/>
      <line x1="170" y1="45" x2="165" y2="55" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="2,2"/>
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