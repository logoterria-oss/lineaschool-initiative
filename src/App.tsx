
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Обычные импорты вместо lazy loading для стабильности
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import OfferPage from "./pages/OfferPage";
import Privacy from "./pages/Privacy";
import DiagForm from "./pages/DiagForm";
import DiagConclusion from "./pages/DiagConclusion";
import ParentQuestionnaire from "./pages/ParentQuestionnaire";
import QuestionnaireResponses from "./pages/QuestionnaireResponses";
import AdminDashboard from "./pages/AdminDashboard";
import ReportsAdmin from "./components/ReportsAdmin";
import DictationsAdmin from "./pages/DictationsAdmin";
import TelegramSetup from "./pages/TelegramSetup";
import PaymentLeadsPage from "./pages/PaymentLeadsPage";
import UploadDictation from "./pages/UploadDictation";
import ExtensionPage from "./pages/ExtensionPage";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
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
              <Route path="/extension" element={<ExtensionPage />} />
              <Route path="/anketa" element={<ParentQuestionnaire />} />
              <Route path="/diag_form" element={<DiagForm />} />
              <Route path="/diag/:serialNumber" element={<DiagConclusion />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/reports" element={<ReportsAdmin />} />
              <Route path="/admin/dictations" element={<DictationsAdmin />} />
              <Route path="/admin/telegram-setup" element={<TelegramSetup />} />
              <Route path="/telegram-setup" element={<TelegramSetup />} />
              <Route path="/admin/questionnaires" element={<QuestionnaireResponses />} />
              <Route path="/admin/payment-leads" element={<PaymentLeadsPage />} />
              <Route path="/admin/ai-manager" element={<AdminPanel />} />
              <Route path="/upload-dictation" element={<UploadDictation />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;