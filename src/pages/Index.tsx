import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import MobileFloatingButtons from "@/components/MobileFloatingButtons";
import AnimatedSpirals from "@/components/AnimatedSpirals";

// Ленивая загрузка тяжелых секций
const FeaturesSection = lazy(() => import("@/components/FeaturesSection"));
const DiagnosticSection = lazy(() => import("@/components/DiagnosticSection"));
const WhyNotTeacherSection = lazy(() => import("@/components/WhyNotTeacherSection"));
const AboutSection = lazy(() => import("@/components/AboutSection"));
const SpecialistsSection = lazy(() => import("@/components/SpecialistsSection"));
const MethodologySection = lazy(() => import("@/components/MethodologySection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const CTASection = lazy(() => import("@/components/CTASection"));
const Footer = lazy(() => import("@/components/Footer"));

const SectionLoader = () => (
  <div className="min-h-[200px] flex items-center justify-center">
    <div className="text-gray-500">Загрузка...</div>
  </div>
);

export default function Index() {
  return (
    <div className="min-h-screen bg-white relative">
      <AnimatedSpirals />
      <Navigation />
      <HeroSection />
      
      <Suspense fallback={<SectionLoader />}>
        <MethodologySection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <FeaturesSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <DiagnosticSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <WhyNotTeacherSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <AboutSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <SpecialistsSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <TestimonialsSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <FAQSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <CTASection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <Footer />
      </Suspense>
      
      <MobileFloatingButtons />
    </div>
  );
}