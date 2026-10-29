import { createFileRoute } from "@tanstack/react-router";
import { titleHead } from "@/components/PageTitle";
import QuestionnaireView from "@/pages/QuestionnaireView";

export const Route = createFileRoute("/anketa/$id")({
    head: () => titleHead("/anketa"),
    component: QuestionnaireView,
});
