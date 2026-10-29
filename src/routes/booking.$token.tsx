import { createFileRoute } from "@tanstack/react-router";
import { titleHead } from "@/components/PageTitle";
import BookingPage from "@/pages/BookingPage";

export const Route = createFileRoute("/booking/$token")({
    head: () => titleHead("/booking"),
    component: BookingPage,
});
