import { createFileRoute } from "@tanstack/react-router";
import { titleHead } from "@/components/PageTitle";
import ParentQuestionnaire from "@/pages/ParentQuestionnaire";

export const Route = createFileRoute("/anketa/")({
    head: () => titleHead("/anketa"),
    component: ParentQuestionnaire,
});
