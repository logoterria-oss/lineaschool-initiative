import { createFileRoute, notFound } from "@tanstack/react-router";
import PayOfferPage, { payOfferHead } from "@/pages/PayOfferPage";
import { getPayOffer } from "@/components/pay/offers";

// Прямые ссылки на оплату конкретной услуги
export const Route = createFileRoute("/pay/$slug")({
    loader: ({ params }) => {
        if (!getPayOffer(params.slug)) throw notFound();
        return null;
    },
    head: ({ params }) => payOfferHead(params.slug),
    component: PayOfferPage,
    // Неизвестная ссылка: та же страница «Страница оплаты не найдена», но с кодом 404
    notFoundComponent: PayOfferPage,
});
