import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const StudentDynamicsReport = lazyWithRetry(() => import("@/pages/StudentDynamicsReport"));

export const Route = createFileRoute("/admin/report/student-dynamics")({
    // Вход сотрудника хранится в браузере (sessionStorage/localStorage) — рендер только в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    component: StudentDynamicsReport,
});
