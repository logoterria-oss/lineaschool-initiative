import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ServicesSection from "@/components/ServicesSection";
import AboutSection from "@/components/AboutSection";
import SpecialistsSection from "@/components/SpecialistsSection";
import MethodologySection from "@/components/MethodologySection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Index() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <MethodologySection />
      <FeaturesSection />
      <ServicesSection />
      <AboutSection />
      <SpecialistsSection />
      <PricingSection />
      <FAQSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}