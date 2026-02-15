import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import BookingModal from "@/components/BookingModal";

export default function MobileFloatingButtons() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleQuestionClick = () => {
    window.open('https://t.me/logoterria?text=Здравствуйте!%20У%20меня%20есть%20вопрос%20по%20коррекции%20дислексии%20и%20дисграфии', '_blank');
  };

  return (
    <>
      {/* Mobile floating buttons - only visible on mobile */}
      <div className="md:hidden fixed bottom-2 right-2 z-50 flex flex-col gap-1.5 items-end">
        <Button 
          onClick={handleQuestionClick}
          variant="outline" 
          size="sm"
          className="bg-white/95 backdrop-blur-sm border-blue-500 text-blue-500 hover:bg-blue-50 shadow-lg h-11 w-11 p-0 min-w-0 flex-shrink-0 rounded-full"
        >
          <Icon name="Send" size={20} />
        </Button>
        
        <Button 
          onClick={() => setIsBookingModalOpen(true)}
          size="sm"
          className="bg-green-500 hover:bg-green-600 text-white shadow-lg h-11 px-3 text-xs font-medium animate-button-pulse rounded-full"
        >
          <Icon name="Calendar" className="mr-1 flex-shrink-0" size={13} />
          <span className="whitespace-nowrap">Записаться</span>
        </Button>
      </div>

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
      />
    </>
  );
}