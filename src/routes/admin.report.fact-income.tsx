import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const FactIncomeReport = lazyWithRetry(() => import("@/pages/FactIncomeReport"));

export const Route = createFileRoute("/admin/report/fact-income")({
    // Вход сотрудника хранится в браузере (sessionStorage/localStorage) — рендер только в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    component: FactIncomeReport,
});
