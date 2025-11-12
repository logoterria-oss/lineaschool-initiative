import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import BookingModal from "@/components/BookingModal";

export default function HeroSection() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  return (
    <section className="relative py-4 sm:py-6 md:py-8 lg:py-12 bg-gradient-to-bl from-green-50 via-white to-green-50/30 overflow-hidden" translate="no">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="px-0">
            <div className="inline-flex items-center border-2 border-blue-500 bg-gradient-to-br from-green-50 via-white to-green-50/30 text-blue-600 px-2 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 rounded-full text-[12px] xs:text-[14px] sm:text-sm font-semibold mb-2 xs:mb-3 sm:mb-4 md:mb-6">🎓 Для детей 8-18 лет</div>
            <h1 className="text-[2.25rem] xs:text-[3rem] sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 xs:mb-4 sm:mb-6 md:mb-8 leading-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(34,197,94,0.15)]">
              Онлайн-коррекция дислексии и дисграфии
            </h1>
            
            <div className="mb-3 xs:mb-4 sm:mb-6 md:mb-8 w-full">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 text-[12px] xs:text-[14px] sm:text-sm md:text-base lg:text-lg px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 py-2 xs:py-2.5 sm:py-3 md:py-4 w-full transition-all duration-300 shadow-lg h-auto min-h-[44px]"
                onClick={() => setIsBookingModalOpen(true)}
              >
                <Icon name="Calendar" className="mr-1 xs:mr-1.5 sm:mr-2 flex-shrink-0" size={14} />
                <span className="text-center leading-tight">Получить БЕСПЛАТНУЮ диагностику</span>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 lg:gap-8 w-full items-center">
              <div className="text-center px-0.5">
                <div className="text-[1.2rem] xs:text-[1.5rem] sm:text-xl md:text-2xl lg:text-4xl font-bold text-green-600 leading-tight">200+</div>
                <div className="text-[11px] xs:text-[13px] sm:text-xs lg:text-sm text-gray-600 leading-tight mt-0.5">довольных семей</div>
              </div>
              <div className="text-center px-0.5">
                <div className="text-[1.2rem] xs:text-[1.5rem] sm:text-xl md:text-2xl lg:text-4xl font-bold text-green-600 leading-tight whitespace-nowrap">от 970₽</div>
                <div className="text-[11px] xs:text-[13px] sm:text-xs lg:text-sm text-gray-600 leading-tight mt-0.5">за урок</div>
              </div>
              <div className="text-center px-0.5">
                <div className="text-[1.2rem] xs:text-[1.5rem] sm:text-xl md:text-2xl lg:text-4xl font-bold text-green-600 leading-tight">98%</div>
                <div className="text-[11px] xs:text-[13px] sm:text-xs lg:text-sm text-gray-600 leading-tight mt-0.5">успешных кейсов</div>
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