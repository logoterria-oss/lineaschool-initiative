import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { titleHead } from "@/components/PageTitle";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const QuestionnaireResponses = lazyWithRetry(() => import("@/pages/QuestionnaireResponses"));

export const Route = createFileRoute("/admin/questionnaires")({
    // Вход сотрудника хранится в браузере (sessionStorage/localStorage) — рендер только в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    head: () => titleHead("/admin/questionnaires"),
    component: QuestionnaireResponses,
});
