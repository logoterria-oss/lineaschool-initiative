import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

export default function NavigationWithoutBooking() {
  return (
    <nav className="bg-white shadow-sm border-b border-green-100 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-24">
          <a href="/" className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
              <Icon name="BookOpen" size={32} className="text-white" />
            </div>
            <span className="text-4xl font-bold text-green-600">LineaSchool</span>
          </a>
          <div className="hidden md:flex items-center space-x-6">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-green-500 text-green-600 hover:bg-green-50 text-lg px-8 py-4"
              onClick={() => window.open('https://t.me/logoterria?text=Здравствуйте!%20У%20меня%20есть%20вопрос%20по%20коррекции%20дислексии%20и%20дисграфии', '_blank')}
            >
              Задать вопрос
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}