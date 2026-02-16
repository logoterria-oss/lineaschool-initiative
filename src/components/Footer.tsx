import Icon from "@/components/ui/icon";

export default function Footer() {
  return (
    <footer id="footer" className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
          {/* Логотип и контакты */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Icon name="BookOpen" size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ЛинэяСкул</span>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">С нами можно связаться</h3>
              <a href="https://e.mail.ru/compose/?to=lineaschool@mail.ru&subject=Вопрос%20по%20коррекции%20дислексии%20и%20дисграфии" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-600 hover:text-green-500">
                <Icon name="Mail" size={16} />
                <span>lineaschool@mail.ru</span>
              </a>
              <a href="https://t.me/logoterria?text=Здравствуйте!%20У%20меня%20есть%20вопрос%20по%20коррекции%20дислексии%20и%20дисграфии" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-600 hover:text-green-500">
                <Icon name="MessageCircle" size={16} />
                <span>Telegram: @logoterria</span>
              </a>
            </div>
          </div>

          {/* Документы и информация */}
          <div className="md:col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4">Документы</h3>
            <div className="space-y-3">
              <a href="/oferta_2025" className="block text-gray-600 hover:text-green-500 text-sm">Договор оферты</a>
              <a href="/privacy" className="block text-gray-600 hover:text-green-500 text-sm">Политика конфиденциальности</a>
              <a href="/price" className="block text-gray-600 hover:text-green-500 text-sm">Стоимость услуг</a>
              <a href="/diag_form" className="block text-gray-600 hover:text-green-500 text-sm">Диагностическая форма (для специалистов)</a>

            </div>
          </div>


        </div>
        
        {/* Разделительная линия */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-500">
              <p>ИП Абраменко В. А.</p>
              <p>ИНН 422306309900</p>
            </div>
            <p className="text-sm text-gray-500">© 2025 ЛинэяСкул. Все права защищены.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}