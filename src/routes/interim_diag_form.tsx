import { createFileRoute } from "@tanstack/react-router";
import { titleHead } from "@/components/PageTitle";
import InterimDiagForm from "@/pages/InterimDiagForm";

export const Route = createFileRoute("/interim_diag_form")({
    head: () => titleHead("/interim_diag_form"),
    component: InterimDiagForm,
});
