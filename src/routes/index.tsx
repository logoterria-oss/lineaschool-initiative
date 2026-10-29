import { createFileRoute } from "@tanstack/react-router";
import Index, { indexHead } from "@/pages/Index";

export const Route = createFileRoute("/")({
    head: () => indexHead(),
    component: Index,
});
