import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

          <PricingSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}