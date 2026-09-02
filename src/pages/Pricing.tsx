import { useEffect } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";

export default function Pricing() {
  useEffect(() => {
    document.title = 'Архив цен - ЛинэяСкул';

    const setMeta = (attr: string, value: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, value);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // Архивный прайс: из поиска убираем, чтобы родители не попадали
    // на неактуальные цены из выдачи
    setMeta('name', 'robots', 'noindex, nofollow');
    setMeta('name', 'description', 'Архив цен прошлого сезона. Актуальную стоимость занятий уточняйте у администратора.');
    setMeta('property', 'og:title', 'Архив цен - ЛинэяСкул');
    setMeta('property', 'og:description', 'Архив цен прошлого сезона.');
    setMeta('property', 'og:url', 'https://lineaschool.ru/archiv_price');

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = 'https://lineaschool.ru/archiv_price';
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-16">
          <PricingSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
