import { useEffect } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";

declare global {
  interface Window {
    onPaymentIntegrationLoad: () => void;
    PaymentIntegration?: any;
  }
}

export default function Pricing() {
  console.log('Pricing page rendering');
  
  useEffect(() => {
    console.log('Pricing useEffect running');
    let script: HTMLScriptElement | null = null;

    const initConfig = {
      terminalKey: import.meta.env.VITE_TBANK_TERMINAL_KEY || '1759382115093DEMO',
      product: 'eacq',
      features: {
        payment: {}
      }
    };

    window.onPaymentIntegrationLoad = () => {
      console.log('T-Bank payment integration loaded');
      
      if (window.PaymentIntegration) {
        window.PaymentIntegration.init(initConfig)
          .then(() => {
            console.log('Payment integration initialized successfully');
          })
          .catch((error: any) => {
            console.error('Payment integration initialization error:', error);
          });
      }
    };

    const existingScript = document.querySelector('script[src="https://integrationjs.tbank.ru/integration.js"]');
    
    if (!existingScript) {
      script = document.createElement('script');
      script.src = 'https://integrationjs.tbank.ru/integration.js';
      script.async = true;
      script.onload = () => {
        if (window.onPaymentIntegrationLoad) {
          window.onPaymentIntegrationLoad();
        }
      };
      document.body.appendChild(script);
    } else if (window.PaymentIntegration) {
      window.onPaymentIntegrationLoad();
    }

    return () => {
      if (script && document.body.contains(script)) {
        document.body.removeChild(script);
      }
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