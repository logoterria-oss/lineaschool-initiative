import { createFileRoute } from "@tanstack/react-router";
import DiagConclusion from "@/pages/DiagConclusion";

export const Route = createFileRoute("/diag/$serialNumber")({
    component: DiagConclusion,
});
