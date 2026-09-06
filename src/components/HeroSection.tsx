import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import BookingModal from "@/components/BookingModal";

const getPromoDeadline = () => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  return `${lastDay.getDate()} ${months[lastDay.getMonth()]}`;
};

export default function HeroSection() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const promoDeadline = getPromoDeadline();
  return (
    <section className="relative pt-4 sm:pt-6 md:pt-5 lg:pt-6 pb-2 sm:pb-3 md:pb-4 lg:pb-5 bg-gradient-to-bl from-green-50 via-white to-green-50/30 overflow-hidden" translate="no">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          <div className="px-0">
            <div className="inline-flex items-center border-2 border-blue-500 bg-gradient-to-br from-green-50 via-white to-green-50/30 text-blue-600 px-2 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 rounded-full text-[12px] xs:text-[14px] sm:text-sm font-semibold mb-2 xs:mb-3 sm:mb-4 md:mb-6">🎓 Для детей 8-18 лет</div>
            <h1 className="text-[2.25rem] xs:text-[3rem] sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 xs:mb-4 sm:mb-6 md:mb-8 leading-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(34,197,94,0.15)]">
              Онлайн-коррекция дислексии и дисграфии
            </h1>
            
            <div className="mb-2 xs:mb-2 sm:mb-3 md:mb-3 w-full">
              <div className="relative">
                {/* Шильдик акции */}
                <div className="absolute -top-3 right-2 sm:right-4 z-20">
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-[10px] xs:text-[11px] sm:text-xs font-bold shadow-lg whitespace-nowrap">
                    <span className="drop-shadow-[0_0_2px_white]">🔥</span> Акция до {promoDeadline}
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  className="relative overflow-hidden bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 text-[12px] xs:text-[14px] sm:text-sm md:text-base lg:text-lg px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 py-2 xs:py-2.5 sm:py-3 md:py-4 w-full transition-all duration-300 shadow-lg h-auto min-h-[44px] lg:button-shine flex items-center justify-start"
                  onClick={() => setIsBookingModalOpen(true)}
                >
                  <div className="absolute left-3 xs:left-4 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-white/20 rounded-lg flex items-center justify-center z-10">
                    <Icon name="Calendar" className="text-white" size={32} />
                  </div>
                  <span className="text-center leading-tight relative z-10 flex flex-col items-center gap-0.5 w-full pl-12 xs:pl-14 sm:pl-16">
                    <span className="font-bold">ЗАПИШИСЬ НА ОБСЛЕДОВАНИЕ</span>
                    <span className="text-[10px] xs:text-[11px] sm:text-xs md:text-sm font-normal opacity-90">комплексное исследование + консультация</span>
                    <span className="inline-flex items-center gap-1 text-[10px] xs:text-[11px] sm:text-xs md:text-sm font-normal opacity-90">
                      <Icon name="Clock" size={13} className="flex-shrink-0" />
                      90–120 минут
                    </span>
                    <span className="text-[12px] xs:text-[14px] sm:text-base md:text-lg font-bold">
                      ВСЕГО 1490₽ <span className="line-through ml-1 font-normal opacity-75">4500₽</span>
                    </span>
                  </span>
                </Button>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 text-gray-500 text-[11px] xs:text-[12px] sm:text-sm">
              <Icon name="BadgeCheck" size={16} className="text-green-600 flex-shrink-0" />
              <span>Образовательная лицензия № Л035-01199-54/05474513</span>
            </div>
          </div>
          
          <div className="relative">
            <BeforeAfterSlider
              examples={[
                {
                  beforeImage: "/img/725de2f7-1ddd-4b52-b0a9-30cf01c3264b.webp",
                  afterImage: "/img/01e04738-94b7-4b8f-b05c-efd09c13e969.webp",
                  beforeAlt: "Письменная работа до коррекции",
                  afterAlt: "Письменная работа после коррекции"
                },
                {
                  beforeImage: "/img/32fa35dc-fd5c-408f-8566-f4d0bb8233a2.webp",
                  afterImage: "/img/a1f4f9c7-ebc3-45e9-8a7c-1aa2ee8e3e12.webp",
                  beforeAlt: "Чтение до коррекции",
                  afterAlt: "Чтение после коррекции"
                },
                {
                  beforeImage: "/img/95564d1d-1f1a-418d-a7cd-800349eec864.webp",
                  afterImage: "/img/c64fbf92-77f6-4b7b-a3df-209a755afc79.webp",
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
                  beforeImage: "/img/38939dc8-5c83-4e82-9ce5-87240e6e9152.webp",
                  afterImage: "https://cdn.poehali.dev/files/a81bb81f-ab4c-4668-8a90-83d89679b37f.jpg",
                  beforeAlt: "Сочинение до коррекции",
                  afterAlt: "Сочинение после коррекции"
                },
                {
                  beforeImage: "https://cdn.poehali.dev/files/0f6ef2ec-0208-4a60-8099-161fc7cd436b.jpg",
                  afterImage: "https://cdn.poehali.dev/files/eb1d9de3-ef3a-4a67-b5ff-9cb32fefb4ab.jpg",
                  beforeAlt: "Рассказ до коррекции",
                  afterAlt: "Рассказ после коррекции"
                },
                {
                  beforeImage: "https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/46a271b1-6494-4175-9350-5664622f6687.jpg",
                  afterImage: "https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/15af0d67-5ad0-48b2-92c4-a66bc81a8584.jpg",
                  beforeAlt: "Классная работа до коррекции",
                  afterAlt: "Классная работа после коррекции"
                },
                {
                  beforeImage: "https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/9227a798-746e-430f-9673-70a63424c74f.png",
                  afterImage: "https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/1565a51a-c380-4288-a9fd-9f588787edaa.png",
                  beforeAlt: "Изложение до коррекции",
                  afterAlt: "Изложение после коррекции"
                },
                {
                  beforeImage: "https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/f749fd1b-0ccf-4287-8d80-ed7022bc6a86.png",
                  afterImage: "https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/47fb6cbd-9a2f-4b68-8b0c-d33aa42708de.jpg",
                  beforeAlt: "Диктант до коррекции почерка",
                  afterAlt: "Диктант после коррекции почерка"
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