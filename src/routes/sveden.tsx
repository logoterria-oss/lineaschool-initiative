import { createFileRoute } from "@tanstack/react-router";
import { titleHead } from "@/components/PageTitle";
import EducationInfo from "@/pages/EducationInfo";

export const Route = createFileRoute("/sveden")({
    head: () => titleHead("/sveden"),
    component: EducationInfo,
});
