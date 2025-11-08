import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import BookingModal from "@/components/BookingModal";

export default function HeroSection() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  return (
    <section className="relative py-8 lg:py-12 bg-gradient-to-br from-green-50 via-white to-green-50/30 overflow-hidden" translate="no">
      {/* Декоративные элементы в пустых местах */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Звездочки - верхние углы */}
        <svg className="absolute top-8 left-8 w-10 h-10 text-blue-300 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
        </svg>
        <svg className="absolute top-16 right-24 w-8 h-8 text-green-300 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
        </svg>
        <svg className="absolute top-40 right-12 w-6 h-6 text-blue-400 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
        </svg>
        
        {/* Облачка - правый верх */}
        <svg className="absolute top-20 right-32 w-14 h-10 text-blue-200 opacity-40" viewBox="0 0 48 32" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M38 16c0-3.3-2.7-6-6-6-.4 0-.8 0-1.2.1C29.5 6.6 26 4 22 4c-5 0-9 4-9 9 0 .3 0 .6.1.9C10.5 14.5 8 17.3 8 20.5 8 24.6 11.4 28 15.5 28H36c3.3 0 6-2.7 6-6s-2.7-6-6-6z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <svg className="absolute top-4 right-64 w-12 h-8 text-green-200 opacity-40" viewBox="0 0 48 32" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M38 16c0-3.3-2.7-6-6-6-.4 0-.8 0-1.2.1C29.5 6.6 26 4 22 4c-5 0-9 4-9 9 0 .3 0 .6.1.9C10.5 14.5 8 17.3 8 20.5 8 24.6 11.4 28 15.5 28H36c3.3 0 6-2.7 6-6s-2.7-6-6-6z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        
        {/* Завитушки - нижние углы и края */}
        <svg className="absolute bottom-12 left-12 w-16 h-16 text-blue-300 opacity-35" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 56 Q16 48 24 48 T40 56 Q48 64 56 56" strokeLinecap="round"/>
        </svg>
        <svg className="absolute bottom-32 left-32 w-14 h-14 text-green-300 opacity-35" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 16 Q24 8 32 16 T48 32 Q56 40 48 48" strokeLinecap="round"/>
        </svg>
        <svg className="absolute bottom-20 right-20 w-16 h-16 text-blue-200 opacity-35" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M32 8 Q40 16 40 24 T32 40 Q24 48 16 48" strokeLinecap="round"/>
        </svg>
        
        {/* Дополнительные звездочки */}
        <svg className="absolute bottom-40 right-40 w-7 h-7 text-green-300 opacity-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
        </svg>
        <svg className="absolute top-1/2 left-20 w-6 h-6 text-blue-300 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
        </svg>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="px-2 sm:px-0">
            <div className="inline-flex items-center border-2 border-blue-500 bg-gradient-to-br from-green-50 via-white to-green-50/30 text-blue-600 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 hover:bg-blue-500 hover:text-white transition-all duration-300">Для детей 8-18 лет</div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 sm:mb-8 leading-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(34,197,94,0.15)]">
              Онлайн-коррекция дислексии и дисграфии
            </h1>
            
            <div className="mb-6 sm:mb-8 max-w-xl">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-3 sm:py-4 w-full transition-all duration-300 shadow-lg"
                onClick={() => setIsBookingModalOpen(true)}
              >
                <Icon name="Calendar" className="mr-1 sm:mr-2" size={18} />
                <span className="whitespace-nowrap">Получить БЕСПЛАТНУЮ диагностику</span>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-xl items-start">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 leading-tight">200+</div>
                <div className="text-xs text-gray-600">довольных семей</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 whitespace-nowrap leading-tight">от 970₽</div>
                <div className="text-xs text-gray-600">за урок</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 leading-tight">98%</div>
                <div className="text-xs text-gray-600">успешных кейсов</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <BeforeAfterSlider
              examples={[
                {
                  beforeImage: "https://cdn.poehali.dev/files/725de2f7-1ddd-4b52-b0a9-30cf01c3264b.jpg",
                  afterImage: "https://cdn.poehali.dev/files/01e04738-94b7-4b8f-b05c-efd09c13e969.jpg",
                  beforeAlt: "Письменная работа до коррекции",
                  afterAlt: "Письменная работа после коррекции"
                },
                {
                  beforeImage: "https://cdn.poehali.dev/files/32fa35dc-fd5c-408f-8566-f4d0bb8233a2.jpg",
                  afterImage: "https://cdn.poehali.dev/files/a1f4f9c7-ebc3-45e9-8a7c-1aa2ee8e3e12.jpg",
                  beforeAlt: "Чтение до коррекции",
                  afterAlt: "Чтение после коррекции"
                },
                {
                  beforeImage: "https://cdn.poehali.dev/files/95564d1d-1f1a-418d-a7cd-800349eec864.jpg",
                  afterImage: "https://cdn.poehali.dev/files/c64fbf92-77f6-4b7b-a3df-209a755afc79.jpg",
                  beforeAlt: "Почерк до коррекции дисграфии",
                  afterAlt: "Почерк после коррекции дисграфии"
                },
                {
                  beforeImage: "https://cdn.poehali.dev/files/c3f18720-39f5-4fa4-859f-44e47527bfad.jpg",
                  afterImage: "https://cdn.poehali.dev/files/522beb76-4da9-4342-b52b-b6b504d954b0.jpg",
                  beforeAlt: "Диктант до коррекции",
                  afterAlt: "Диктант после коррекции"
                },
                {
                  beforeImage: "https://cdn.poehali.dev/files/38939dc8-5c83-4e82-9ce5-87240e6e9152.jpg",
                  afterImage: "https://cdn.poehali.dev/files/a81bb81f-ab4c-4668-8a90-83d89679b37f.jpg",
                  beforeAlt: "Сочинение до коррекции",
                  afterAlt: "Сочинение после коррекции"
                },
                {
                  beforeImage: "https://cdn.poehali.dev/files/0f6ef2ec-0208-4a60-8099-161fc7cd436b.jpg",
                  afterImage: "https://cdn.poehali.dev/files/eb1d9de3-ef3a-4a67-b5ff-9cb32fefb4ab.jpg",
                  beforeAlt: "Рассказ до коррекции",
                  afterAlt: "Рассказ после коррекции"
                }
              ]}
            />
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