import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { titleHead } from "@/components/PageTitle";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const ReportsAdmin = lazyWithRetry(() => import("@/components/ReportsAdmin"));

export const Route = createFileRoute("/admin/reports")({
    // Вход сотрудника хранится в браузере (sessionStorage/localStorage) — рендер только в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    head: () => titleHead("/admin/reports"),
    component: ReportsAdmin,
});
