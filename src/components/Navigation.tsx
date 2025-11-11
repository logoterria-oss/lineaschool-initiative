import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import BookingModal from "@/components/BookingModal";

export default function Navigation() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  return (
    <>
    <nav className="bg-white/95 backdrop-blur-md shadow-md border-b border-green-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20 lg:h-24">
          <a href="/" className="flex items-center space-x-2 xs:space-x-2.5 sm:space-x-3 md:space-x-4 min-w-0 flex-shrink overflow-hidden">
            <div className="w-11 h-11 xs:w-12 xs:h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name="BookOpen" size={22} className="text-white xs:w-6 xs:h-6 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
            </div>
            <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-green-600 truncate">LineaSchool</span>
          </a>
          <div className="hidden md:flex items-center space-x-3 lg:space-x-6 flex-shrink-0">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white text-sm lg:text-lg px-4 lg:px-8 py-2 lg:py-4 transition-all duration-300"
              onClick={() => window.open('https://wa.me/79236251611?text=Здравствуйте!%20У%20меня%20есть%20вопрос%20по%20коррекции%20дислексии%20и%20дисграфии', '_blank')}
            >
              Задать вопрос
            </Button>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-sm lg:text-lg px-4 lg:px-8 py-2 lg:py-4 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => setIsBookingModalOpen(true)}
            >
              Записаться
            </Button>
            <a
              href="/admin/reports"
              className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200 rounded-lg hover:bg-green-50 flex-shrink-0"
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