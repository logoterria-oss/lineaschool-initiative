import { createFileRoute } from "@tanstack/react-router";
import DiagBookingPage from "@/pages/DiagBookingPage";

export const Route = createFileRoute("/diag-booking/$token")({
    head: () => ({ meta: [{ title: 'Запись на диагностику' }] }),
    component: DiagBookingPage,
});
