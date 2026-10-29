import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { titleHead } from "@/components/PageTitle";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const TeacherPersonalCabinet = lazyWithRetry(() => import("@/pages/TeacherPersonalCabinet"));

export const Route = createFileRoute("/admin/teacher-lk")({
    // Вход сотрудника хранится в браузере (sessionStorage/localStorage) — рендер только в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    head: () => titleHead("/admin/teacher-lk"),
    component: TeacherPersonalCabinet,
});
