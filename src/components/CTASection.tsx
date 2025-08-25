import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import BookingModal from "@/components/BookingModal";

export default function CTASection() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  return (
    <section className="py-20 bg-gradient-to-r from-green-500 to-emerald-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">
          Начните путь к успешному обучению уже сегодня
        </h2>
        <p className="text-xl text-green-100 mb-8 leading-relaxed">
          Запишитесь на бесплатную консультацию и узнайте, как мы можем помочь вашему ребёнку
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 text-lg px-8" onClick={() => setIsBookingModalOpen(true)}>
            <Icon name="Calendar" className="mr-2" size={20} />
            Записаться на диагностику
          </Button>
          <Button size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-green-600 text-lg px-8">
            <Icon name="Mail" className="mr-2" size={20} />
            Написать нам
          </Button>
        </div>
      </div>

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
      />
    </section>
  );
}