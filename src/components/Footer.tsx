import Icon from "@/components/ui/icon";

export default function Footer() {
  return (
    <footer id="footer" className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Icon name="BookOpen" size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">LineaSchool</span>
            </div>
            <p className="text-gray-400 mb-4">
              Профессиональная коррекция дислексии и дисграфии для детей 7-18 лет
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-green-500">
                <Icon name="Mail" size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-green-500">
                <Icon name="Phone" size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Услуги</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-green-500">Диагностика</a></li>
              <li><a href="#" className="text-gray-400 hover:text-green-500">Индивидуальные занятия</a></li>
              <li><a href="#" className="text-gray-400 hover:text-green-500">Групповые занятия</a></li>
              <li><a href="#" className="text-gray-400 hover:text-green-500">Консультации</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">О школе</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-green-500">Наши методы</a></li>
              <li><a href="#" className="text-gray-400 hover:text-green-500">Специалисты</a></li>
              <li><a href="#" className="text-gray-400 hover:text-green-500">Отзывы</a></li>
              <li><a href="#" className="text-gray-400 hover:text-green-500">Блог</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Контакты</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">info@linea-school.ru</li>
              <li className="text-gray-400">+7 (495) 123-45-67</li>
              <li className="text-gray-400">Онлайн-школа</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">© 2024 LineaSchool. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}