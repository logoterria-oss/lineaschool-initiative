import { useEffect } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";

declare global {
  interface Window {
    onPaymentIntegrationLoad: () => void;
    TinkoffPayment?: any;
  }
}

export default function Pricing() {
  useEffect(() => {
    window.onPaymentIntegrationLoad = () => {
      console.log('Tbank payment integration loaded');
    };

    const script = document.createElement('script');
    script.src = 'https://integrationjs.tbank.ru/integration.js';
    script.async = true;
    script.onload = () => {
      if (window.onPaymentIntegrationLoad) {
        window.onPaymentIntegrationLoad();
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      delete window.onPaymentIntegrationLoad;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
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