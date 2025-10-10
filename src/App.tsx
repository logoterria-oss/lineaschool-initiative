
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
const ReportsAdmin = lazy(() => import("./components/ReportsAdmin"));
const DictationsAdmin = lazy(() => import("./pages/DictationsAdmin"));
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
              <Route path="/diag_form" element={<DiagForm />} />
              <Route path="/diag/:serialNumber" element={<DiagConclusion />} />
              <Route path="/admin/reports" element={<ReportsAdmin />} />
              <Route path="/admin/dictations" element={<DictationsAdmin />} />
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