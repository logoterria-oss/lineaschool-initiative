import { createFileRoute } from "@tanstack/react-router";
import { titleHead } from "@/components/PageTitle";
import LineaStudies from "@/pages/LineaStudies";

export const Route = createFileRoute("/lineastudies")({
    head: () => titleHead("/lineastudies"),
    component: LineaStudies,
});
