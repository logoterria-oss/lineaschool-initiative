import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Публичные страницы — грузятся сразу, их видят клиенты.
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Остальное подгружается только при переходе на страницу,
// чтобы посетитель главной не скачивал всю админку.
const LineaStudies = lazy(() => import("./pages/LineaStudies"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Pricing20262027 = lazy(() => import("./pages/Pricing20262027"));
const OfferPage = lazy(() => import("./pages/OfferPage"));
const Privacy = lazy(() => import("./pages/Privacy"));
const EducationInfo = lazy(() => import("./pages/EducationInfo"));
const ExtensionPage = lazy(() => import("./pages/ExtensionPage"));
const ParentQuestionnaire = lazy(() => import("./pages/ParentQuestionnaire"));
const DiagForm = lazy(() => import("./pages/DiagForm"));
const InterimDiagForm = lazy(() => import("./pages/InterimDiagForm"));
const DiagConclusion = lazy(() => import("./pages/DiagConclusion"));
const InterimDiagConclusion = lazy(() => import("./pages/InterimDiagConclusion"));

const QuestionnaireResponses = lazy(() => import("./pages/QuestionnaireResponses"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const RoleSelectPage = lazy(() => import("./pages/RoleSelectPage"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const TeacherPersonalCabinet = lazy(() => import("./pages/TeacherPersonalCabinet"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));
const HeadDashboard = lazy(() => import("./pages/HeadDashboard"));
const HeadReportsPage = lazy(() => import("./pages/HeadReportsPage"));
const HeadSupervisionsPage = lazy(() => import("./pages/HeadSupervisionsPage"));
const HeadViolationsPage = lazy(() => import("./pages/HeadViolationsPage"));
const AdminRegulationsPage = lazy(() => import("./pages/AdminRegulationsPage"));
const HeadStaffViolationsPage = lazy(() => import("./pages/HeadStaffViolationsPage"));
const AdvanceIncomeReport = lazy(() => import("./pages/AdvanceIncomeReport"));
const RetentionReport = lazy(() => import("./pages/RetentionReport"));
const RetentionDynamics = lazy(() => import("./pages/RetentionDynamics"));
const StudentDynamicsReport = lazy(() => import("./pages/StudentDynamicsReport"));
const ReportsAdmin = lazy(() => import("./components/ReportsAdmin"));
const TelegramSetup = lazy(() => import("./pages/TelegramSetup"));
const PaymentLeadsPage = lazy(() => import("./pages/PaymentLeadsPage"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));
const StudentsTablePage = lazy(() => import("./pages/StudentsTablePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const StaffManagePage = lazy(() => import("./pages/StaffManagePage"));
const StaffProfilePage = lazy(() => import("./pages/StaffProfilePage"));
const StaffHomePage = lazy(() => import("./pages/StaffHomePage"));
const HeadWorkspace = lazy(() => import("./pages/HeadWorkspace"));
const AdminWorkspace = lazy(() => import("./pages/AdminWorkspace"));

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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/lineastudies" element={<LineaStudies />} />
            <Route path="/price" element={<Pricing />} />
            {/* Новые цены 2026–2027: пока без перехода с главной */}
            <Route path="/price_2026-2027" element={<Pricing20262027 />} />
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
