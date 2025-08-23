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
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <MethodologySection />
      <FeaturesSection />
      <DiagnosticSection />
      <WhyNotTeacherSection />
      <AboutSection />
      <SpecialistsSection />
      <PricingSection />
      <FAQSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
      <MobileFloatingButtons />
    </div>
  );
}