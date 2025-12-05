import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import BookingModal from "@/components/BookingModal";

export default function CTASection() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  const openAlfaCRMWidget = () => {
    window.open('https://11086.s20.online/common/1/form/draw?id=1&lead_source_id=8&baseColor=205EDC&borderRadius=8&css=%2F%2Fcdn.alfacrm.pro%2Flead-form%2Fform.css', '_blank', 'width=600,height=700');
  };

  return (
    <section className="py-20 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent"></div>
      <div className="relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">
          Начните путь к успешному обучению уже сегодня
        </h2>
        <p className="text-xl text-green-100 mb-8 leading-relaxed">
          Запишитесь на бесплатную консультацию и узнайте, как мы можем помочь вашему ребёнку
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 text-lg px-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105" onClick={openAlfaCRMWidget}>
            <Icon name="Calendar" className="mr-2" size={20} />
            Записаться на диагностику
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-white bg-transparent text-white hover:bg-white hover:text-green-600 text-lg px-8"
            onClick={() => window.open('https://wa.me/79236251611?text=Здравствуйте!%20У%20меня%20есть%20вопрос%20по%20коррекции%20дислексии%20и%20дисграфии', '_blank')}
          >
            <Icon name="Mail" className="mr-2" size={20} />
            Написать нам
          </Button>
        </div>
      </div>
      </div>

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
      />
    </section>
  );
}