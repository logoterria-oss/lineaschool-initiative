import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { useRef, useEffect, useState } from "react";

export default function FeaturesSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const features = [
    {
      icon: "Target",
      title: "Индивидуальный подход",
      description: "Персональная программа коррекции, учитывающая особенности каждого ребёнка"
    },
    {
      icon: "Users",
      title: "Опытные специалисты",
      description: "Команда сертифицированных логопедов и нейропсихологов"
    },
    {
      icon: "Monitor",
      title: "Онлайн-формат",
      description: "Удобные занятия из дома с интерактивными материалами"
    },
    {
      icon: "BarChart",
      title: "Отслеживание прогресса",
      description: "Регулярные отчеты о достижениях вашего ребёнка"
    },
    {
      icon: "Heart",
      title: "Поддержка семьи",
      description: "Консультации и рекомендации для родителей"
    },
    {
      icon: "Award",
      title: "Гарантия результата",
      description: "Возврат средств, если не увидите улучшений"
    }
  ];

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
    scrollContainerRef.current?.scrollBy({ left: -280, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 280, behavior: 'smooth' });
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Почему выбирают нас?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Мы используем передовые методики и индивидуальный подход к каждому ребёнку
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-green-100 hover:shadow-lg transition-all duration-300 p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Icon name={feature.icon as any} size={24} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
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
            {features.map((feature, index) => (
              <Card key={index} className="border-green-100 p-6 min-w-[280px] snap-start flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon name={feature.icon as any} size={24} className="text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}