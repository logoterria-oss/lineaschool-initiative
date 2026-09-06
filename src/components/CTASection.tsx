import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import BookingModal from "@/components/BookingModal";
import ContactChoiceDialog from "@/components/ContactChoiceDialog";

export default function CTASection() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <section className="py-20 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent"></div>
      <div className="relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">
          Начните путь к успешному обучению уже сегодня
        </h2>
        <p className="text-xl text-green-100 mb-8 leading-relaxed">Запишитесь на консультацию и узнайте, как мы можем помочь вашему ребёнку</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 text-lg px-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105" onClick={() => setIsBookingModalOpen(true)}>
            <Icon name="Calendar" className="mr-2" size={20} />
            Записаться на диагностику
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-white bg-transparent text-white hover:bg-white hover:text-green-600 text-lg px-8"
            onClick={() => setIsContactOpen(true)}
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

      <ContactChoiceDialog open={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </section>
  );
}