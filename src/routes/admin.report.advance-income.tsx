import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const AdvanceIncomeReport = lazyWithRetry(() => import("@/pages/AdvanceIncomeReport"));

export const Route = createFileRoute("/admin/report/advance-income")({
    // Вход сотрудника хранится в браузере (sessionStorage/localStorage) — рендер только в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    component: AdvanceIncomeReport,
});
