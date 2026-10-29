import { createFileRoute } from "@tanstack/react-router";
import { titleHead } from "@/components/PageTitle";
import OfferPage from "@/pages/OfferPage";

export const Route = createFileRoute("/oferta_2025")({
    head: () => titleHead("/oferta_2025"),
    component: OfferPage,
});
