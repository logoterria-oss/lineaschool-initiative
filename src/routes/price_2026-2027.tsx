import { createFileRoute } from "@tanstack/react-router";
import Pricing20262027, { pricing20262027Head } from "@/pages/Pricing20262027";

export const Route = createFileRoute("/price_2026-2027")({
    head: () => pricing20262027Head(),
    component: Pricing20262027,
});
