import Icon from "@/components/ui/icon";

export default function Footer() {
  return (
    <footer id="footer" className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Логотип и название */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Icon name="BookOpen" size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">LineaSchool</span>
          </div>
          
          {/* Контактная информация */}
          <div className="mb-8">
            <h3 className="text-white font-semibold mb-4">С нами можно связаться</h3>
            <div className="flex items-center justify-center space-x-8">
              <a href="mailto:lineaschool@mail.ru" className="flex items-center space-x-2 text-gray-400 hover:text-green-500">
                <Icon name="Mail" size={20} />
                <span>lineaschool@mail.ru</span>
              </a>
              <a href="https://wa.me/79236251611" className="flex items-center space-x-2 text-gray-400 hover:text-green-500">
                <Icon name="MessageCircle" size={20} />
                <span>+7 (923) 625-16-11</span>
              </a>
            </div>
          </div>

          {/* Документы и страницы */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="/offer" className="text-gray-400 hover:text-green-500">Договор оферты</a>
              <a href="/privacy" className="text-gray-400 hover:text-green-500">Политика конфиденциальности</a>
              <a href="/pricing" className="text-gray-400 hover:text-green-500">Стоимость услуг</a>
              <a href="/education-info" className="text-gray-400 hover:text-green-500">Сведения об образовательной организации</a>
            </div>
          </div>

          {/* Способы оплаты */}
          <div className="mb-8">
            <h3 className="text-white font-semibold mb-4">Способы оплаты</h3>
            <div className="flex items-center justify-center space-x-6">
              <div className="bg-gray-800 rounded-lg p-3 flex items-center space-x-2">
                <Icon name="CreditCard" size={20} className="text-gray-400" />
                <span className="text-gray-400 text-sm">Т-Банк</span>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 flex items-center space-x-2">
                <Icon name="Wallet" size={20} className="text-gray-400" />
                <span className="text-gray-400 text-sm">СберСплит</span>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 flex items-center space-x-2">
                <Icon name="Clock" size={20} className="text-gray-400" />
                <span className="text-gray-400 text-sm">Долями</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8">
            <p className="text-gray-400 mb-2">ИП Абраменко В. А.</p>
            <p className="text-gray-400 text-sm">ИНН 422306309900</p>
            <p className="text-gray-400 text-xs mt-4">© 2024 LineaSchool. Все права защищены.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}