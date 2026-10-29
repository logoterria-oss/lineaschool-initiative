import { createFileRoute } from "@tanstack/react-router";
import { titleHead } from "@/components/PageTitle";
import Privacy from "@/pages/Privacy";

export const Route = createFileRoute("/privacy")({
    head: () => titleHead("/privacy"),
    component: Privacy,
});
