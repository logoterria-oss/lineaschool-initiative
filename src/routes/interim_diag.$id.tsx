import { createFileRoute } from "@tanstack/react-router";
import InterimDiagConclusion from "@/pages/InterimDiagConclusion";

export const Route = createFileRoute("/interim_diag/$id")({
    component: InterimDiagConclusion,
});
