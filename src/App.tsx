
import { Suspense, lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Lazy load компоненты для улучшения производительности
const Index = lazy(() => import("./pages/Index"));
const Pricing = lazy(() => import("./pages/Pricing"));
const OfferPage = lazy(() => import("./pages/OfferPage"));
const Privacy = lazy(() => import("./pages/Privacy"));
const DiagForm = lazy(() => import("./pages/DiagForm"));
const DiagConclusion = lazy(() => import("./pages/DiagConclusion"));
const ParentQuestionnaire = lazy(() => import("./pages/ParentQuestionnaire"));
const QuestionnaireResponses = lazy(() => import("./pages/QuestionnaireResponses"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ReportsAdmin = lazy(() => import("./components/ReportsAdmin"));
const DictationsAdmin = lazy(() => import("./pages/DictationsAdmin"));
const TelegramSetup = lazy(() => import("./pages/TelegramSetup"));
const PaymentLeadsPage = lazy(() => import("./pages/PaymentLeadsPage"));
const UploadDictation = lazy(() => import("./pages/UploadDictation"));
const ExtensionPage = lazy(() => import("./pages/ExtensionPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Компонент загрузки
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/upload-dictation" element={<UploadDictation />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;