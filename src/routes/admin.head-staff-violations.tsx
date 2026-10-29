import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { titleHead } from "@/components/PageTitle";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const HeadStaffViolationsPage = lazyWithRetry(() => import("@/pages/HeadStaffViolationsPage"));

export const Route = createFileRoute("/admin/head-staff-violations")({
    // Вход сотрудника хранится в браузере (sessionStorage/localStorage) — рендер только в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    head: () => titleHead("/admin/head-staff-violations"),
    component: HeadStaffViolationsPage,
});
