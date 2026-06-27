
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
import RoleSelectPage from "./pages/RoleSelectPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import HeadDashboard from "./pages/HeadDashboard";
import HeadReportsPage from "./pages/HeadReportsPage";
import HeadSupervisionsPage from "./pages/HeadSupervisionsPage";
import HeadViolationsPage from "./pages/HeadViolationsPage";
import AdminRegulationsPage from "./pages/AdminRegulationsPage";
import HeadStaffViolationsPage from "./pages/HeadStaffViolationsPage";
import AdvanceIncomeReport from "./pages/AdvanceIncomeReport";
import RetentionReport from "./pages/RetentionReport";
import RetentionDynamics from "./pages/RetentionDynamics";
import ReportsAdmin from "./components/ReportsAdmin";
import TelegramSetup from "./pages/TelegramSetup";
import PaymentLeadsPage from "./pages/PaymentLeadsPage";
import ExtensionPage from "./pages/ExtensionPage";
import SchedulePage from "./pages/SchedulePage";
import StudentsTablePage from "./pages/StudentsTablePage";
import SettingsPage from "./pages/SettingsPage";
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
            <Route path="/extension" element={<ExtensionPage />} />
            <Route path="/anketa" element={<ParentQuestionnaire />} />
            <Route path="/diag_form" element={<DiagForm />} />
            <Route path="/diag/:serialNumber" element={<DiagConclusion />} />
            <Route path="/admin" element={<RoleSelectPage />} />
            <Route path="/admin/role-select" element={<RoleSelectPage />} />
            <Route path="/admin/diag" element={<AdminDashboard />} />
            <Route path="/admin/teacher" element={<TeacherDashboard />} />
            <Route path="/admin/manager" element={<ManagerDashboard />} />
            <Route path="/admin/head" element={<HeadDashboard />} />
            <Route path="/admin/head-reports" element={<HeadReportsPage />} />
            <Route path="/admin/head-supervisions" element={<HeadSupervisionsPage />} />
            <Route path="/admin/head-violations" element={<HeadViolationsPage />} />
            <Route path="/admin/regulations" element={<AdminRegulationsPage />} />
            <Route path="/admin/head-staff-violations" element={<HeadStaffViolationsPage />} />
            <Route path="/admin/report/advance-income" element={<AdvanceIncomeReport />} />
            <Route path="/admin/report/retention" element={<RetentionReport />} />
            <Route path="/admin/report/retention-dynamics" element={<RetentionDynamics />} />
            <Route path="/admin/reports" element={<ReportsAdmin />} />
            <Route path="/admin/telegram-setup" element={<TelegramSetup />} />
            <Route path="/telegram-setup" element={<TelegramSetup />} />
            <Route path="/admin/questionnaires" element={<QuestionnaireResponses />} />
            <Route path="/admin/payment-leads" element={<PaymentLeadsPage />} />
            <Route path="/admin/schedule" element={<SchedulePage />} />
            <Route path="/admin/students" element={<StudentsTablePage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;