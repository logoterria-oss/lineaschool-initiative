import SEOHead from "@/components/SEOHead";
import YandexMetaTags from "@/components/YandexMetaTags";
import { organizationSchema, serviceSchema, faqSchema, webPageSchema } from "@/utils/structuredData";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import MethodologySection from "@/components/MethodologySection";
import FeaturesSection from "@/components/FeaturesSection";
import DiagnosticSection from "@/components/DiagnosticSection";
import WhyNotTeacherSection from "@/components/WhyNotTeacherSection";
import AboutSection from "@/components/AboutSection";
import SpecialistsSection from "@/components/SpecialistsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import MobileFloatingButtons from "@/components/MobileFloatingButtons";
import MobileOptimizedSpirals from "@/components/MobileOptimizedSpirals";

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
        title="Онлайн коррекция дислексии и дисграфии для детей 8-18 лет | ЛинэяСкул"
        description="Эффективная онлайн-коррекция дислексии и дисграфии для детей 8-18 лет. Нейрологопедический подход, 200+ довольных семей, от 970₽ за урок. Бесплатная диагностика."
        keywords="дислексия, дисграфия, коррекция, логопед онлайн, нейрологопед, дети, обучение, дефектолог, нарушения чтения, нарушения письма"
        ogImage="https://cdn.poehali.dev/files/81420758-6ed0-43fe-b7e7-c6317caea682.png"
        canonicalUrl="https://lineaschool.ru"
        structuredData={combinedSchema}
      />
      <YandexMetaTags />
      
      <div className="min-h-screen bg-white relative">
        <MobileOptimizedSpirals />
        <Navigation />
        <HeroSection />
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
      </div>
    </>
  );
}