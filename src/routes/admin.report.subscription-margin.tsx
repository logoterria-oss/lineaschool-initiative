import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const SubscriptionMarginReport = lazyWithRetry(() => import("@/pages/SubscriptionMarginReport"));

export const Route = createFileRoute("/admin/report/subscription-margin")({
    // Вход сотрудника хранится в браузере (sessionStorage/localStorage) — рендер только в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    component: SubscriptionMarginReport,
});
