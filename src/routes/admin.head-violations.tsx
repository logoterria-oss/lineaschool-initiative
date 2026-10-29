import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { titleHead } from "@/components/PageTitle";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const HeadViolationsPage = lazyWithRetry(() => import("@/pages/HeadViolationsPage"));

export const Route = createFileRoute("/admin/head-violations")({
    // Вход сотрудника хранится в браузере (sessionStorage/localStorage) — рендер только в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    head: () => titleHead("/admin/head-violations"),
    component: HeadViolationsPage,
});
