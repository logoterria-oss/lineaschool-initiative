import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import Pricing20262027, { pricing20262027Head } from "@/pages/Pricing20262027";

// Старые адреса прайса ведут на актуальные цены: родители приходили по
// ссылкам из переписок. Сервер сразу отдаёт актуальный прайс (canonical —
// /price_2026-2027), а в браузере адрес заменяется на актуальный, как раньше.
function RedirectToActualPrice() {
    const navigate = useNavigate();
    useEffect(() => {
        navigate({ to: "/price_2026-2027", replace: true });
    }, [navigate]);
    return <Pricing20262027 />;
}

export const Route = createFileRoute("/archiv_price/")({
    head: () => pricing20262027Head(),
    component: RedirectToActualPrice,
});
