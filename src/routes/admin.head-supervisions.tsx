import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { titleHead } from "@/components/PageTitle";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const HeadSupervisionsPage = lazyWithRetry(() => import("@/pages/HeadSupervisionsPage"));

export const Route = createFileRoute("/admin/head-supervisions")({
    // Вход сотрудника хранится в браузере (sessionStorage/localStorage) — рендер только в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    head: () => titleHead("/admin/head-supervisions"),
    component: HeadSupervisionsPage,
});
