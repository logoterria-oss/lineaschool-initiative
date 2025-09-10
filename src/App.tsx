
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import OfferPage from "./pages/OfferPage";
import Privacy from "./pages/Privacy";
import DiagForm from "./pages/DiagForm";
import DiagConclusion from "./pages/DiagConclusion";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/price" element={<Pricing />} />
          <Route path="/oferta_2025" element={<OfferPage />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/diag_form" element={<DiagForm />} />
          <Route path="/diag/:serialNumber" element={<DiagConclusion />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;