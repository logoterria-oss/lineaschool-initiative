import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";
import Icon from "@/components/ui/icon";
import { Link } from "@/lib/router-compat";

/** Мета-теги архива цен — для head() маршрута */
export const pricingHead = () => ({
  meta: [
    { title: 'Архив цен - ЛинэяСкул' },
    // Архивный прайс: из поиска убираем, чтобы родители не попадали
    // на неактуальные цены из выдачи
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'description', content: 'Архив цен прошлого сезона. Оплата недоступна, актуальные цены — в разделе «Стоимость занятий».' },
    { property: 'og:title', content: 'Архив цен - ЛинэяСкул' },
    { property: 'og:description', content: 'Архив цен прошлого сезона.' },
    { property: 'og:url', content: 'https://lineaschool.ru/archiv_price/history' },
  ],
  links: [{ rel: 'canonical', href: 'https://lineaschool.ru/archiv_price/history' }],
});

export default function Pricing() {

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