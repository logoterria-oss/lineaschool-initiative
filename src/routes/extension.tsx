import { createFileRoute } from "@tanstack/react-router";
import ExtensionPage, { extensionHead } from "@/pages/ExtensionPage";

export const Route = createFileRoute("/extension")({
    head: () => extensionHead(),
    component: ExtensionPage,
});
