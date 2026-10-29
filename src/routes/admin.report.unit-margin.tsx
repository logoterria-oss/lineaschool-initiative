import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const UnitMarginReport = lazyWithRetry(() => import("@/pages/UnitMarginReport"));

export const Route = createFileRoute("/admin/report/unit-margin")({
    // Вход сотрудника хранится в браузере (sessionStorage/localStorage) — рендер только в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    component: UnitMarginReport,
});
