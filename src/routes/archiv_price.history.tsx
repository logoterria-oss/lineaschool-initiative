import { createFileRoute } from "@tanstack/react-router";
import Pricing, { pricingHead } from "@/pages/Pricing";

export const Route = createFileRoute("/archiv_price/history")({
    head: () => pricingHead(),
    component: Pricing,
});
