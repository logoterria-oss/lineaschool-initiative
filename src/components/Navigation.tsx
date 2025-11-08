import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import BookingModal from "@/components/BookingModal";

export default function Navigation() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  return (
    <>
    <nav className="bg-white/95 backdrop-blur-md shadow-md border-b border-green-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
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
              className="border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white text-lg px-8 py-4 transition-all duration-300"
              onClick={() => window.open('https://wa.me/79236251611?text=Здравствуйте!%20У%20меня%20есть%20вопрос%20по%20коррекции%20дислексии%20и%20дисграфии', '_blank')}
            >
              Задать вопрос
            </Button>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => setIsBookingModalOpen(true)}
            >
              Записаться
            </Button>
            <a
              href="/admin/reports"
              className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200 rounded-lg hover:bg-green-50"
              title="Админ-панель"
            >
              <Icon name="Settings" size={20} />
            </a>
          </div>
        </div>
      </div>

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
      />
    </nav>
    </>
  );
}