import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { titleHead } from "@/components/PageTitle";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const AdminWorkspace = lazyWithRetry(() => import("@/pages/AdminWorkspace"));

export const Route = createFileRoute("/admin/admin-workspace")({
    // Вход сотрудника хранится в браузере (sessionStorage/localStorage) — рендер только в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    head: () => titleHead("/admin/admin-workspace"),
    component: AdminWorkspace,
});
