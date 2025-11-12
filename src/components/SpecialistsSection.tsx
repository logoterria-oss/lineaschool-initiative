import { Card, CardContent } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { useRef, useEffect, useState } from "react";

const specialists = [
  {
    name: "Виктория Абраменко",
    role: "Логопед, нейропсихолог",
    description: "Руководитель центра, диагност, супервизор, автор методических материалов и научных статей",
    avatar: "https://cdn.poehali.dev/files/00f8a984-4db0-4798-a44e-25454f9fdb47.jpg"
  },
  {
    name: "Нонна Мельникова",
    role: "Логопед, нейропсихолог",
    description: "Специалист по развитию регуляторных функций у детей с нарушениями процессов чтения, письма и счета",
    avatar: "https://cdn.poehali.dev/files/30606456-0ee2-4e60-9645-922284dd63d0.jpeg"
  },
  {
    name: "Валерия Камнева",
    role: "Дефектолог, логопед, нейропсихолог",
    description: "Специалист по развитию высших психических функций, коррекции нарушений процессов чтения, письма и счета",
    avatar: "https://cdn.poehali.dev/files/b998fb86-1c75-4e05-aa20-53b45bbe48ee.jpeg"
  },
  {
    name: "Анастасия Найденова", 
    role: "Логопед",
    description: "Специалист по комплексной диагностике и коррекции дислексий и дисграфий",
    avatar: "https://cdn.poehali.dev/files/39e06528-df6e-46ad-a501-a6a4de01c57e.jpg"
  },
  {
    name: "Дарья Еремина",
    role: "Логопед", 
    description: "Специалист по коррекции дислексии и дисграфии у детей школьного возраста",
    avatar: "https://cdn.poehali.dev/files/093e20f2-e0ae-4a2e-9d50-61e102662d3e.jpg"
  }
];

export default function SpecialistsSection() {
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollPosition = () => {
    const container = window.innerWidth >= 768 ? desktopScrollRef.current : mobileScrollRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const handleResize = () => checkScrollPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollLeft = () => {
    const container = window.innerWidth >= 768 ? desktopScrollRef.current : mobileScrollRef.current;
    container?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const container = window.innerWidth >= 768 ? desktopScrollRef.current : mobileScrollRef.current;
    container?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <section id="specialists" className="py-20 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Наши специалисты</h2>
        </div>

        {/* Desktop Scrollable */}
        <div className="hidden md:block relative">
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-green-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icon name="ChevronLeft" size={24} className="text-gray-700" />
          </button>
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-green-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icon name="ChevronRight" size={24} className="text-gray-700" />
          </button>
          <div
            ref={desktopScrollRef}
            onScroll={checkScrollPosition}
            className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {specialists.map((specialist, index) => (
              <Card key={index} className="border-green-100 hover:shadow-lg transition-all duration-300 text-center w-[280px] snap-start flex-shrink-0">
                <CardContent className="p-6">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden ring-2 ring-green-200">
                    <img 
                      src={specialist.avatar} 
                      alt={specialist.name}
                      className="w-full h-full object-cover object-[center_20%]"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{specialist.name}</h3>
                  <p className="text-green-600 font-medium mb-3">{specialist.role}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{specialist.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mobile Swipeable */}
        <div className="md:hidden relative">
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
            >
              <Icon name="ChevronLeft" size={20} className="text-gray-600" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
            >
              <Icon name="ChevronRight" size={20} className="text-gray-600" />
            </button>
          )}
          <div
            ref={mobileScrollRef}
            onScroll={checkScrollPosition}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 px-2"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {specialists.map((specialist, index) => (
              <Card key={index} className="border-green-100 w-[calc(100vw-3rem)] max-w-[320px] snap-start flex-shrink-0 text-center">
                <CardContent className="p-6">
                  <div className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden ring-2 ring-green-200">
                    <img 
                      src={specialist.avatar} 
                      alt={specialist.name}
                      className="w-full h-full object-cover object-[center_20%]"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800">{specialist.name}</h3>
                    <p className="text-green-600 font-medium text-base">{specialist.role}</p>
                    <p className="text-gray-600 text-sm leading-relaxed px-2">{specialist.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Dots indicator */}
          <div className="flex justify-center space-x-2 mt-4">
            {specialists.map((_, index) => (
              <div key={index} className="w-2 h-2 rounded-full bg-gray-300"></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}