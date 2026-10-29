import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { titleHead } from "@/components/PageTitle";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const RoleSelectPage = lazyWithRetry(() => import("@/pages/RoleSelectPage"));

export const Route = createFileRoute("/admin/")({
    // Вход сотрудника хранится в браузере (sessionStorage/localStorage) — рендер только в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    head: () => titleHead("/admin"),
    component: RoleSelectPage,
});
