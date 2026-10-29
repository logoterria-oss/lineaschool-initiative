import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const RetentionDynamics = lazyWithRetry(() => import("@/pages/RetentionDynamics"));

export const Route = createFileRoute("/admin/report/retention-dynamics")({
    // Вход сотрудника хранится в браузере (sessionStorage/localStorage) — рендер только в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    component: RetentionDynamics,
});
