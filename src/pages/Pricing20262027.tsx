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

    const setMeta = (attr: string, value: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, value);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // Основная страница цен: открыта для поиска, чтобы родители попадали
    // именно на актуальные тарифы, а не на архив прошлого сезона.
    setMeta('name', 'robots', 'index, follow');
    setMeta(
      'name',
      'description',
      'Стоимость онлайн-занятий по коррекции дислексии и дисграфии у детей 8–18 лет в 2026–2027 учебном году.',
    );
    setMeta('property', 'og:title', 'Стоимость занятий 2026–2027 - ЛинэяСкул');
    setMeta('property', 'og:url', 'https://lineaschool.ru/price_2026-2027');

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = 'https://lineaschool.ru/price_2026-2027';
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="pt-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <div className="text-center mb-20">
            <span className="inline-block bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              Учебный год 2026–2027
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Стоимость занятий
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Онлайн-коррекция дислексии и дисграфии у детей 8–18 лет
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