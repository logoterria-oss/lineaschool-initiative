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
    <div className="min-h-screen bg-white relative">
      {/* SVG фоновые элементы */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Большие круги */}
          <circle cx="90%" cy="10%" r="120" fill="url(#gradient1)" opacity="0.3"/>
          <circle cx="5%" cy="25%" r="90" fill="url(#gradient2)" opacity="0.25"/>
          <circle cx="75%" cy="70%" r="100" fill="url(#gradient3)" opacity="0.2"/>
          
          {/* Средние элементы */}
          <circle cx="95%" cy="65%" r="60" fill="url(#gradient4)" opacity="0.15"/>
          <circle cx="35%" cy="85%" r="70" fill="url(#gradient5)" opacity="0.25"/>
          
          {/* Маленькие акценты */}
          <circle cx="50%" cy="50%" r="40" fill="url(#gradient6)" opacity="0.1"/>
          <circle cx="25%" cy="75%" r="35" fill="url(#gradient7)" opacity="0.15"/>
          
          {/* Определение градиентов */}
          <defs>
            <radialGradient id="gradient1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d1fae5"/>
              <stop offset="100%" stopColor="#a7f3d0"/>
            </radialGradient>
            <radialGradient id="gradient2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#dbeafe"/>
              <stop offset="100%" stopColor="#bfdbfe"/>
            </radialGradient>
            <radialGradient id="gradient3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e9d5ff"/>
              <stop offset="100%" stopColor="#d8b4fe"/>
            </radialGradient>
            <radialGradient id="gradient4" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#dcfce7"/>
              <stop offset="100%" stopColor="#bbf7d0"/>
            </radialGradient>
            <radialGradient id="gradient5" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f0f9ff"/>
              <stop offset="100%" stopColor="#e0f2fe"/>
            </radialGradient>
            <radialGradient id="gradient6" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f0fdfa"/>
              <stop offset="100%" stopColor="#ccfbf1"/>
            </radialGradient>
            <radialGradient id="gradient7" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#eef2ff"/>
              <stop offset="100%" stopColor="#e0e7ff"/>
            </radialGradient>
          </defs>
        </svg>
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