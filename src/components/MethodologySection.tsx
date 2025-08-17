import { Card, CardContent } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

export default function MethodologySection() {
  const BrainSVG = ({ activeAreas, className = "" }: { activeAreas: string[], className?: string }) => (
    <svg className={`w-full h-full ${className}`} viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Контур мозга в профиль */}
      <path
        d="M40 120C40 100 50 80 70 65C90 50 120 45 150 50C180 55 200 65 220 75C240 85 260 95 280 105C285 110 280 120 275 130C270 140 260 150 245 155C230 160 210 165 185 165C160 165 140 160 120 150C100 140 80 130 65 125C50 120 40 120 40 120Z"
        fill="#F8F9FA"
        stroke="#9CA3AF"
        strokeWidth="1"
      />
      
      {/* Лобная доля - передняя часть */}
      <path
        d="M40 120C40 100 55 85 75 75C95 65 115 65 135 70C150 75 160 85 165 100C170 115 165 130 155 140C145 150 130 155 115 155C100 155 85 150 70 140C55 130 45 125 40 120Z"
        fill={activeAreas.includes('frontal') ? '#4C82F4' : '#E3F2FD'}
        stroke="#4C82F4"
        strokeWidth="1.5"
        className="transition-colors duration-300"
      />
      
      {/* Теменная доля - верхняя центральная часть */}
      <path
        d="M165 100C165 85 175 75 190 70C205 65 220 65 235 70C250 75 260 85 265 95C270 105 265 115 255 125C245 135 230 140 215 140C200 140 185 135 175 125C170 115 165 105 165 100Z"
        fill={activeAreas.includes('parietal') ? '#F59E0B' : '#FFF7ED'}
        stroke="#F59E0B"
        strokeWidth="1.5"
        className="transition-colors duration-300"
      />
      
      {/* Височная доля - боковая нижняя часть */}
      <path
        d="M115 155C115 140 130 135 145 135C160 135 175 140 185 150C195 160 190 170 180 175C170 180 155 180 140 175C125 170 115 165 115 155Z"
        fill={activeAreas.includes('temporal') ? '#E91E63' : '#FCE4EC'}
        stroke="#E91E63"
        strokeWidth="1.5"
        className="transition-colors duration-300"
      />
      
      {/* Затылочная доля - задняя часть */}
      <path
        d="M255 125C255 110 265 100 275 95C285 90 290 95 290 105C290 115 285 125 275 135C265 145 255 150 245 150C240 150 245 140 250 135C255 130 255 125 255 125Z"
        fill={activeAreas.includes('occipital') ? '#4CAF50' : '#E8F5E9'}
        stroke="#4CAF50"
        strokeWidth="1.5"
        className="transition-colors duration-300"
      />
      
      {/* Моторная кора - полоска между лобной и теменной */}
      <path
        d="M155 85C155 80 165 75 175 75C185 75 195 80 195 85C195 90 185 95 175 95C165 95 155 90 155 85Z"
        fill={activeAreas.includes('motor') ? '#9C27B0' : '#F3E5F5'}
        stroke="#9C27B0"
        strokeWidth="1.5"
        className="transition-colors duration-300"
      />
      
      {/* Мозжечок - внизу сзади */}
      <ellipse
        cx="240"
        cy="170"
        rx="25"
        ry="15"
        fill="#FFB74D"
        stroke="#FF9800"
        strokeWidth="1"
      />
      
      {/* Ствол мозга */}
      <rect
        x="210"
        y="150"
        width="15"
        height="25"
        fill="#8D6E63"
        stroke="#5D4037"
        strokeWidth="1"
        rx="3"
      />
      
      {/* Борозды для реалистичности */}
      <path d="M70 90C90 95 110 100 130 105" stroke="#9CA3AF" strokeWidth="0.5" fill="none"/>
      <path d="M80 110C100 115 120 120 140 125" stroke="#9CA3AF" strokeWidth="0.5" fill="none"/>
      <path d="M170 85C190 90 210 95 230 100" stroke="#9CA3AF" strokeWidth="0.5" fill="none"/>
      <path d="M175 105C195 110 215 115 235 120" stroke="#9CA3AF" strokeWidth="0.5" fill="none"/>
      
      {/* Подписи */}
      <text x="100" y="110" fontSize="9" fill="#1976D2" textAnchor="middle" fontWeight="600">FRONTAL</text>
      <text x="100" y="120" fontSize="9" fill="#1976D2" textAnchor="middle" fontWeight="600">LOBE</text>
      
      <text x="215" y="95" fontSize="9" fill="#F57C00" textAnchor="middle" fontWeight="600">PARIETAL</text>
      <text x="215" y="105" fontSize="9" fill="#F57C00" textAnchor="middle" fontWeight="600">LOBE</text>
      
      <text x="150" y="165" fontSize="9" fill="#C2185B" textAnchor="middle" fontWeight="600">TEMPORAL</text>
      <text x="150" y="175" fontSize="9" fill="#C2185B" textAnchor="middle" fontWeight="600">LOBE</text>
      
      <text x="270" y="115" fontSize="9" fill="#388E3C" textAnchor="middle" fontWeight="600">OCCIPITAL</text>
      <text x="270" y="125" fontSize="9" fill="#388E3C" textAnchor="middle" fontWeight="600">LOBE</text>
      
      <text x="175" y="70" fontSize="8" fill="#7B1FA2" textAnchor="middle" fontWeight="600">Motor cortex</text>
      
      <text x="240" y="190" fontSize="8" fill="#FF9800" textAnchor="middle" fontWeight="500">Мозжечок</text>
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