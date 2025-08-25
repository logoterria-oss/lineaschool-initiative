import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import DiagnosticSection from "@/components/DiagnosticSection";
import WhyNotTeacherSection from "@/components/WhyNotTeacherSection";
import AboutSection from "@/components/AboutSection";
import SpecialistsSection from "@/components/SpecialistsSection";
import MethodologySection from "@/components/MethodologySection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import TestimonialsSection from "@/components/TestimonialsSection";

import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import MobileFloatingButtons from "@/components/MobileFloatingButtons";

export default function Index() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Декоративные фоновые элементы */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Большие круги */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-green-50 to-green-100 rounded-full opacity-40"></div>
        <div className="absolute top-1/4 -left-16 w-48 h-48 bg-gradient-to-tr from-blue-50 to-blue-100 rounded-full opacity-30"></div>
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-gradient-to-bl from-purple-50 to-purple-100 rounded-full opacity-25"></div>
        
        {/* Средние элементы */}
        <div className="absolute top-2/3 -right-8 w-32 h-32 bg-gradient-to-tl from-green-100 to-emerald-100 rounded-full opacity-20"></div>
        <div className="absolute bottom-16 left-1/3 w-40 h-40 bg-gradient-to-br from-sky-50 to-sky-100 rounded-full opacity-30"></div>
        
        {/* Маленькие акценты */}
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-full opacity-15"></div>
        <div className="absolute top-3/4 left-1/4 w-20 h-20 bg-gradient-to-b from-indigo-50 to-indigo-100 rounded-full opacity-20"></div>
      </div>

      <div className="relative z-10">
        <Navigation />
        <HeroSection />
        <MethodologySection />
        <FeaturesSection />
        <DiagnosticSection />
        <WhyNotTeacherSection />
        <AboutSection />
        <SpecialistsSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
        <Footer />
        <MobileFloatingButtons />
      </div>
    </div>
  );
}