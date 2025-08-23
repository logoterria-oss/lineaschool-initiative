import { Card, CardContent } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { useRef, useEffect, useState } from "react";

const specialists = [
  {
    name: "Виктория Абраменко",
    role: "Логопед-нейропсихолог",
    description: "Руководитель центра, диагност, супервизор, автор методических материалов и научных статей",
    avatar: "https://cdn.poehali.dev/files/00f8a984-4db0-4798-a44e-25454f9fdb47.jpg"
  },
  {
    name: "Анастасия Найденова", 
    role: "Логопед-нейропсихолог",
    description: "Специалист по комплексной диагностике и коррекции",
    avatar: "https://cdn.poehali.dev/files/39e06528-df6e-46ad-a501-a6a4de01c57e.jpg"
  },
  {
    name: "Мила Яровець",
    role: "Логопед",
    description: "Специалист по коррекции дислексии и дисграфии у младших школьников",
    avatar: "https://cdn.poehali.dev/files/b6aa3ad4-6e9c-4fe1-8741-3009f1cf33c2.jpg"
  },
  {
    name: "Дарья Еремина",
    role: "Логопед", 
    description: "Специалист по коррекции дислексии и дисграфии у старших школьников",
    avatar: "https://cdn.poehali.dev/files/093e20f2-e0ae-4a2e-9d50-61e102662d3e.jpg"
  }
];

export default function SpecialistsSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
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
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <section id="specialists" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Наши специалисты</h2>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {specialists.map((specialist, index) => (
            <Card key={index} className="border-green-100 hover:shadow-lg transition-all duration-300 text-center">
              <CardContent className="p-6">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden ring-2 ring-green-200">
                  <img 
                    src={specialist.avatar} 
                    alt={specialist.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{specialist.name}</h3>
                <p className="text-green-600 font-medium mb-3">{specialist.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{specialist.description}</p>
              </CardContent>
            </Card>
          ))}
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
            ref={scrollContainerRef}
            onScroll={checkScrollPosition}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {specialists.map((specialist, index) => (
              <Card key={index} className="border-green-100 min-w-[280px] snap-start flex-shrink-0 text-center">
                <CardContent className="p-6">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden ring-2 ring-green-200">
                    <img 
                      src={specialist.avatar} 
                      alt={specialist.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 mb-2">{specialist.name}</h3>
                  <p className="text-green-600 font-medium mb-3 text-sm">{specialist.role}</p>
                  <p className="text-gray-600 text-xs leading-relaxed">{specialist.description}</p>
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