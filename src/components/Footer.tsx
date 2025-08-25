import Icon from "@/components/ui/icon";

export default function Footer() {
  return (
    <footer id="footer" className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Логотип и название */}
          <div className="flex items-center justify-center space-x-2 mb-6">
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
              <a href="https://wa.me/" className="flex items-center space-x-2 text-gray-400 hover:text-green-500">
                <Icon name="MessageCircle" size={20} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8">
            <p className="text-gray-400">© 2024 LineaSchool. Все права защищены.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}