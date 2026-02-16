import { Helmet } from 'react-helmet-async';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";

export default function Pricing() {

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Стоимость занятий - ЛинэяСкул</title>
        <meta name="description" content="Профессиональная помощь детям 8-18 лет с трудностями чтения и письма. Индивидуальные онлайн-занятия по коррекции дислексии и дисграфии." />
        <meta property="og:title" content="Стоимость занятий - ЛинэяСкул" />
        <meta property="og:description" content="Профессиональная помощь детям 8-18 лет с трудностями чтения и письма. Индивидуальные онлайн-занятия по коррекции дислексии и дисграфии." />
        <meta property="og:url" content="https://lineaschool.ru/price" />
        <link rel="canonical" href="https://lineaschool.ru/price" />
      </Helmet>
      
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