import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import BookingModal from "@/components/BookingModal";

export default function MobileFloatingButtons() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleQuestionClick = () => {
    // Можно добавить логику для открытия чата или формы вопроса
    // Пока что просто скроллим к контактам в футере
    const footer = document.getElementById('footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Mobile floating buttons - only visible on mobile */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex gap-3">
        <Button 
          onClick={handleQuestionClick}
          variant="outline" 
          className="flex-1 bg-white/95 backdrop-blur-sm border-green-500 text-green-600 hover:bg-green-50 shadow-lg h-12 text-base font-semibold"
        >
          <Icon name="MessageCircle" className="mr-2" size={20} />
          Задать вопрос
        </Button>
        
        <Button 
          onClick={() => setIsBookingModalOpen(true)}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white shadow-lg h-12 text-base font-semibold"
        >
          <Icon name="Calendar" className="mr-2" size={20} />
          Записаться
        </Button>
      </div>

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
      />
    </>
  );
}