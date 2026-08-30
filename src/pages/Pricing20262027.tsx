import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BookingModal from '@/components/BookingModal';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import DiagnosticsSection from '@/components/pricing2026/DiagnosticsSection';
import SubscriptionsSection from '@/components/pricing2026/SubscriptionsSection';
import IndividualSection from '@/components/pricing2026/IndividualSection';

export default function Pricing20262027() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    document.title = 'Стоимость занятий 2026–2027 - ЛинэяСкул';

    // Страница готовится к запуску и не должна попадать в поиск,
    // пока её не откроют для перехода с сайта.
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const hadRobots = Boolean(robots);
    const previousRobots = robots?.content;

    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = 'noindex, nofollow';

    return () => {
      if (!robots) return;
      if (hadRobots && previousRobots !== undefined) {
        robots.content = previousRobots;
      } else {
        robots.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="pt-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <div className="text-center mb-12">
            <span className="inline-block bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              Учебный год 2026–2027
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Стоимость занятий
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Онлайн-коррекция дислексии и дисграфии для детей 8–18 лет
            </p>
          </div>

          <DiagnosticsSection />
          <SubscriptionsSection />
          <IndividualSection />

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Не знаете, какой тариф выбрать? Запишитесь на бесплатную консультацию
            </p>
            <Button
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
              onClick={() => setIsBookingModalOpen(true)}
            >
              <Icon name="MessageCircle" className="mr-2" size={20} />
              Получить консультацию
            </Button>
          </div>
        </div>
      </main>

      <Footer />

      <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} />
    </div>
  );
}