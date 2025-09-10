import { lazy, Suspense, useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import MethodologySection from "@/components/MethodologySection";
import FeaturesSection from "@/components/FeaturesSection";
import MobileFloatingButtons from "@/components/MobileFloatingButtons";
import MobileOptimizedSpirals from "@/components/MobileOptimizedSpirals";
import ErrorBoundary from "@/components/ErrorBoundary";

// Ленивая загрузка только тяжелых секций
const DiagnosticSection = lazy(() => import("@/components/DiagnosticSection"));
const WhyNotTeacherSection = lazy(() => import("@/components/WhyNotTeacherSection"));
const AboutSection = lazy(() => import("@/components/AboutSection"));
const SpecialistsSection = lazy(() => import("@/components/SpecialistsSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const CTASection = lazy(() => import("@/components/CTASection"));
const Footer = lazy(() => import("@/components/Footer"));

const SectionLoader = () => (
  <div className="min-h-[200px] flex items-center justify-center bg-gray-50">
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
      <div className="text-gray-600">Загрузка...</div>
    </div>
  </div>
);

export default function Index() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Показываем базовый контент без анимации во время загрузки
    return (
      <div className="min-h-screen bg-white relative">
        <Navigation />
        <HeroSection />
        <div className="py-8 text-center text-gray-500">
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      <ErrorBoundary>
        <MobileOptimizedSpirals />
      </ErrorBoundary>
      
      <Navigation />
      <HeroSection />
      
      {/* Основные секции загружаются сразу */}
      <MethodologySection />
      <FeaturesSection />
      
      {/* Ленивая загрузка для остальных секций */}
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <DiagnosticSection />
        </Suspense>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <WhyNotTeacherSection />
        </Suspense>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <AboutSection />
        </Suspense>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <SpecialistsSection />
        </Suspense>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <TestimonialsSection />
        </Suspense>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <FAQSection />
        </Suspense>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <CTASection />
        </Suspense>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <Footer />
        </Suspense>
      </ErrorBoundary>
      
      <MobileFloatingButtons />
    </div>
  );
}