import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const RetentionReport = lazyWithRetry(() => import("@/pages/RetentionReport"));

export const Route = createFileRoute("/admin/report/retention")({
    // Вход сотрудника хранится в браузере (sessionStorage/localStorage) — рендер только в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    component: RetentionReport,
});
