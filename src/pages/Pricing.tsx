import { useEffect } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";
import Icon from "@/components/ui/icon";
import { Link } from "react-router-dom";

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
    setMeta('name', 'description', 'Архив цен прошлого сезона. Оплата недоступна, актуальные цены — в разделе «Стоимость занятий».');
    setMeta('property', 'og:title', 'Архив цен - ЛинэяСкул');
    setMeta('property', 'og:description', 'Архив цен прошлого сезона.');
    setMeta('property', 'og:url', 'https://lineaschool.ru/archiv_price/history');

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = 'https://lineaschool.ru/archiv_price/history';
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-16">
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
            <p className="font-semibold text-amber-900">
              Архив: цены прошлого учебного года
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Страница сохранена для истории, оплата по этим ценам недоступна.
            </p>
            <Link
              to="/price_2026-2027"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              Актуальные цены 2026–2027
              <Icon name="ArrowRight" size={16} />
            </Link>
          </div>

          <PricingSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}