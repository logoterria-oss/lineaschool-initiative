import { createFileRoute } from "@tanstack/react-router";
import StaffPagePending from "@/components/StaffPagePending";
import { titleHead } from "@/components/PageTitle";
import TelegramSetup from "@/pages/TelegramSetup";

export const Route = createFileRoute("/telegram-setup")({
    // Служебная страница: данные грузятся в браузере
    ssr: false,
    pendingComponent: StaffPagePending,
    head: () => titleHead("/telegram-setup"),
    component: TelegramSetup,
});
