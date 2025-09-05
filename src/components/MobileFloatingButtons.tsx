import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import BookingModal from "@/components/BookingModal";

export default function MobileFloatingButtons() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleQuestionClick = () => {
    window.open('https://wa.me/79236251611?text=Здравствуйте!%20У%20меня%20есть%20вопрос%20по%20коррекции%20дислексии%20и%20дисграфии', '_blank');
  };

  return (
    <>
      {/* Mobile floating buttons - only visible on mobile */}
      <div className="md:hidden fixed bottom-4 left-2 right-2 z-50 flex gap-2 max-w-sm mx-auto">
        <Button 
          onClick={handleQuestionClick}
          variant="outline" 
          size="sm"
          className="flex-1 bg-white/95 backdrop-blur-sm border-green-500 text-green-600 hover:bg-green-50 shadow-lg h-11 text-sm font-medium min-w-0"
        >
          <Icon name="MessageCircle" className="mr-1" size={16} />
          <span className="truncate">Вопрос</span>
        </Button>
        
        <Button 
          onClick={() => setIsBookingModalOpen(true)}
          size="sm"
          className="flex-1 bg-green-500 hover:bg-green-600 text-white shadow-lg h-11 text-sm font-medium animate-button-pulse min-w-0"
        >
          <Icon name="Calendar" className="mr-1" size={16} />
          <span className="truncate">Записаться</span>
        </Button>
      </div>

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
      />
    </>
  );
}