import { createFileRoute } from "@tanstack/react-router";
import { titleHead } from "@/components/PageTitle";
import DiagForm from "@/pages/DiagForm";

export const Route = createFileRoute("/diag_form")({
    head: () => titleHead("/diag_form"),
    component: DiagForm,
});
