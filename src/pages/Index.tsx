import { Suspense, lazy } from 'react';
import SEOHead from "@/components/SEOHead";
import YandexMetaTags from "@/components/YandexMetaTags";
import { organizationSchema, serviceSchema, faqSchema, webPageSchema } from "@/utils/structuredData";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";

// Lazy load неприоритетных компонентов
const MethodologySection = lazy(() => import("@/components/MethodologySection"));
const FeaturesSection = lazy(() => import("@/components/FeaturesSection"));
const DiagnosticSection = lazy(() => import("@/components/DiagnosticSection"));
const WhyNotTeacherSection = lazy(() => import("@/components/WhyNotTeacherSection"));
const AboutSection = lazy(() => import("@/components/AboutSection"));
const SpecialistsSection = lazy(() => import("@/components/SpecialistsSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const CTASection = lazy(() => import("@/components/CTASection"));
const Footer = lazy(() => import("@/components/Footer"));
const MobileFloatingButtons = lazy(() => import("@/components/MobileFloatingButtons"));
const MobileOptimizedSpirals = lazy(() => import("@/components/MobileOptimizedSpirals"));

// Компонент загрузки секций
const SectionLoader = () => (
  <div className="flex items-center justify-center py-8">
    <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function Index() {
  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema,
      serviceSchema,
      faqSchema,
      webPageSchema
    ]
  };

  return (
    <>
      <SEOHead
        title="Онлайн коррекция дислексии и дисграфии для детей 8-18 лет | LineaSchool"
        description="Эффективная онлайн-коррекция дислексии и дисграфии для детей 8-18 лет. Нейрологопедический подход, 200+ довольных семей, от 970₽ за урок. Бесплатная диагностика."
        keywords="дислексия, дисграфия, коррекция, логопед онлайн, нейрологопед, дети, обучение, дефектолог, нарушения чтения, нарушения письма"
        ogImage="https://cdn.poehali.dev/files/81420758-6ed0-43fe-b7e7-c6317caea682.png"
        canonicalUrl="https://lineaschool.ru"
        structuredData={combinedSchema}
      />
      <YandexMetaTags />
      
      <div className="min-h-screen bg-white relative">
        <Suspense fallback={<SectionLoader />}>
          <MobileOptimizedSpirals />
        </Suspense>
        <Navigation />
        <HeroSection />
        <Suspense fallback={<SectionLoader />}>
          <MethodologySection />
          <FeaturesSection />
          <DiagnosticSection />
          <WhyNotTeacherSection />
          <AboutSection />
          <SpecialistsSection />
          <TestimonialsSection />
          <FAQSection />
          <CTASection />
          <Footer />
          <MobileFloatingButtons />
        </Suspense>
      </div>
    </>
  );
}