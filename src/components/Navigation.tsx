import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b border-green-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Icon name="BookOpen" size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-green-600">LineaSchool</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#about" className="text-gray-600 hover:text-green-600 font-medium">О нас</a>
            <a href="#services" className="text-gray-600 hover:text-green-600 font-medium">Услуги</a>
            <a href="#pricing" className="text-gray-600 hover:text-green-600 font-medium">Стоимость</a>
            <a href="#specialists" className="text-gray-600 hover:text-green-600 font-medium">Специалисты</a>
            <a href="#faq" className="text-gray-600 hover:text-green-600 font-medium">FAQ</a>
            <Button className="bg-green-500 hover:bg-green-600">Записаться</Button>
          </div>
        </div>
      </div>
    </nav>
  );
}