import { Suspense } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Публичные страницы — грузятся сразу, их видят клиенты.
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BackToAdminHome from "@/components/BackToAdminHome";

// Остальное подгружается только при переходе на страницу,
// чтобы посетитель главной не скачивал всю админку.
const LineaStudies = lazyWithRetry(() => import("./pages/LineaStudies"));
const Pricing = lazyWithRetry(() => import("./pages/Pricing"));
const Pricing20262027 = lazyWithRetry(() => import("./pages/Pricing20262027"));
const PayOfferPage = lazyWithRetry(() => import("./pages/PayOfferPage"));
const OfferPage = lazyWithRetry(() => import("./pages/OfferPage"));
const Privacy = lazyWithRetry(() => import("./pages/Privacy"));
const EducationInfo = lazyWithRetry(() => import("./pages/EducationInfo"));
const ExtensionPage = lazyWithRetry(() => import("./pages/ExtensionPage"));
const ParentQuestionnaire = lazyWithRetry(() => import("./pages/ParentQuestionnaire"));
const DiagForm = lazyWithRetry(() => import("./pages/DiagForm"));
const InterimDiagForm = lazyWithRetry(() => import("./pages/InterimDiagForm"));
const DiagConclusion = lazyWithRetry(() => import("./pages/DiagConclusion"));
const InterimDiagConclusion = lazyWithRetry(() => import("./pages/InterimDiagConclusion"));

const QuestionnaireResponses = lazyWithRetry(() => import("./pages/QuestionnaireResponses"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const RoleSelectPage = lazyWithRetry(() => import("./pages/RoleSelectPage"));
const TeacherDashboard = lazyWithRetry(() => import("./pages/TeacherDashboard"));
const TeacherPersonalCabinet = lazyWithRetry(() => import("./pages/TeacherPersonalCabinet"));
const ManagerDashboard = lazyWithRetry(() => import("./pages/ManagerDashboard"));
const HeadDashboard = lazyWithRetry(() => import("./pages/HeadDashboard"));
const HeadReportsPage = lazyWithRetry(() => import("./pages/HeadReportsPage"));
const HeadSupervisionsPage = lazyWithRetry(() => import("./pages/HeadSupervisionsPage"));
const HeadViolationsPage = lazyWithRetry(() => import("./pages/HeadViolationsPage"));
const AdminRegulationsPage = lazyWithRetry(() => import("./pages/AdminRegulationsPage"));
const HeadStaffViolationsPage = lazyWithRetry(() => import("./pages/HeadStaffViolationsPage"));
const FactIncomeReport = lazyWithRetry(() => import("./pages/FactIncomeReport"));
const AdvanceIncomeReport = lazyWithRetry(() => import("./pages/AdvanceIncomeReport"));
const RetentionReport = lazyWithRetry(() => import("./pages/RetentionReport"));
const RetentionDynamics = lazyWithRetry(() => import("./pages/RetentionDynamics"));
const StudentDynamicsReport = lazyWithRetry(() => import("./pages/StudentDynamicsReport"));
const ReportsAdmin = lazyWithRetry(() => import("./components/ReportsAdmin"));
const TelegramSetup = lazyWithRetry(() => import("./pages/TelegramSetup"));
const PaymentLeadsPage = lazyWithRetry(() => import("./pages/PaymentLeadsPage"));
const SchedulePage = lazyWithRetry(() => import("./pages/SchedulePage"));
const BookingPage = lazyWithRetry(() => import("./pages/BookingPage"));
const StudentsTablePage = lazyWithRetry(() => import("./pages/StudentsTablePage"));
const SettingsPage = lazyWithRetry(() => import("./pages/SettingsPage"));
const StaffManagePage = lazyWithRetry(() => import("./pages/StaffManagePage"));
const StaffProfilePage = lazyWithRetry(() => import("./pages/StaffProfilePage"));
const StaffHomePage = lazyWithRetry(() => import("./pages/StaffHomePage"));
const HeadWorkspace = lazyWithRetry(() => import("./pages/HeadWorkspace"));
const AdminWorkspace = lazyWithRetry(() => import("./pages/AdminWorkspace"));

import PageTitle from "./components/PageTitle";

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PageTitle />
        <BackToAdminHome />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/lineastudies" element={<LineaStudies />} />
            {/* Все старые адреса прайса ведут на актуальные цены: родители
                приходили по ссылкам из переписок и платили по ценам прошлого
                сезона. Архив с историческими цифрами (без оплаты) остаётся
                по адресу /archiv_price/history для внутренних сверок */}
            <Route path="/archiv_price" element={<Navigate to="/price_2026-2027" replace />} />
            <Route path="/price" element={<Navigate to="/price_2026-2027" replace />} />
            <Route path="/archiv_price/history" element={<Pricing />} />
            <Route path="/price_2026-2027" element={<Pricing20262027 />} />
            {/* Прямые ссылки на оплату конкретной услуги */}
            <Route path="/pay/:slug" element={<PayOfferPage />} />
            <Route path="/oferta_2025" element={<OfferPage />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/sveden" element={<EducationInfo />} />
            <Route path="/extension" element={<ExtensionPage />} />
            <Route path="/anketa" element={<ParentQuestionnaire />} />
            <Route path="/diag_form" element={<DiagForm />} />
            <Route path="/interim_diag_form" element={<InterimDiagForm />} />
            <Route path="/diag/:serialNumber" element={<DiagConclusion />} />
            <Route path="/interim_diag/:id" element={<InterimDiagConclusion />} />
            <Route path="/admin" element={<RoleSelectPage />} />
            <Route path="/admin/role-select" element={<RoleSelectPage />} />
            <Route path="/admin/diag" element={<AdminDashboard />} />
            <Route path="/admin/teacher" element={<TeacherDashboard />} />
            <Route path="/admin/teacher-lk" element={<TeacherPersonalCabinet />} />
            <Route path="/admin/manager" element={<ManagerDashboard />} />
            <Route path="/admin/admin-workspace" element={<AdminWorkspace />} />
            <Route path="/admin/head" element={<HeadDashboard />} />
            <Route path="/admin/head-reports" element={<HeadReportsPage />} />
            <Route path="/admin/head-supervisions" element={<HeadSupervisionsPage />} />
            <Route path="/admin/head-violations" element={<HeadViolationsPage />} />
            <Route path="/admin/regulations" element={<AdminRegulationsPage />} />
            <Route path="/admin/head-staff-violations" element={<HeadStaffViolationsPage />} />
            <Route path="/admin/report/fact-income" element={<FactIncomeReport />} />
            <Route path="/admin/report/advance-income" element={<AdvanceIncomeReport />} />
            <Route path="/admin/report/retention" element={<RetentionReport />} />
            <Route path="/admin/report/retention-dynamics" element={<RetentionDynamics />} />
            <Route path="/admin/report/student-dynamics" element={<StudentDynamicsReport />} />
            <Route path="/admin/reports" element={<ReportsAdmin />} />
            <Route path="/admin/telegram-setup" element={<TelegramSetup />} />
            <Route path="/telegram-setup" element={<TelegramSetup />} />
            <Route path="/admin/questionnaires" element={<QuestionnaireResponses />} />
            <Route path="/admin/payment-leads" element={<PaymentLeadsPage />} />
            <Route path="/admin/schedule" element={<SchedulePage />} />
            <Route path="/booking/:token" element={<BookingPage />} />
            <Route path="/admin/students" element={<StudentsTablePage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/admin/staff" element={<StaffManagePage />} />
            <Route path="/admin/profile" element={<StaffProfilePage />} />
            <Route path="/admin/home" element={<StaffHomePage />} />
            <Route path="/admin/head-workspace" element={<HeadWorkspace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;