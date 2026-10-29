import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CTASection from '@/components/CTASection';
import DiagnosticsSection from '@/components/pricing2026/DiagnosticsSection';
import SubscriptionsSection from '@/components/pricing2026/SubscriptionsSection';
import IndividualSection from '@/components/pricing2026/IndividualSection';

/** Мета-теги страницы цен — для head() маршрута */
export const pricing20262027Head = () => ({
  meta: [
    { title: 'Стоимость занятий 2026–2027 - ЛинэяСкул' },
    // Основная страница цен: открыта для поиска, чтобы родители попадали
    // именно на актуальные тарифы, а не на архив прошлого сезона.
    { name: 'robots', content: 'index, follow' },
    {
      name: 'description',
      content: 'Стоимость онлайн-занятий по коррекции дислексии и дисграфии у детей 8–18 лет в 2026–2027 учебном году.',
    },
    { property: 'og:title', content: 'Стоимость занятий 2026–2027 - ЛинэяСкул' },
    { property: 'og:url', content: 'https://lineaschool.ru/price_2026-2027' },
  ],
  links: [{ rel: 'canonical', href: 'https://lineaschool.ru/price_2026-2027' }],
});

export default function Pricing20262027() {

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
        </div>
      </main>

      <CTASection />

      <Footer />
    </div>
  );
}