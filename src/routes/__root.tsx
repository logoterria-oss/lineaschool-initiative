import {Suspense, useEffect, type ReactNode} from "react";
import {HeadContent, Outlet, Scripts, createRootRoute} from "@tanstack/react-router";
import {Toaster} from "@/components/ui/toaster";
import {Toaster as Sonner} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import {PLATFORM_META, PLATFORM_SCRIPTS} from "@/platform/scripts.gen";
import {HMR_CLIENT} from "@/platform/dev-hmr";
import appCss from "@/index.css?url";
import NotFound from "@/pages/NotFound";
import BackToAdminHome from "@/components/BackToAdminHome";
import {captureUtm} from "@/lib/utm";

const TITLE = "ЛинэяСкул - коррекция дислексии и дисграфии онлайн";
const DESCRIPTION =
    "Помогаем детям 8–18 лет, которые читают по слогам, путают буквы и делают ошибки на письме. Занятия с нейрологопедом онлайн по научно доказанным методикам. Диагностика за 1490₽ вместо 4500₽, индивидуальный план и первые результаты за 3 месяца.";
const OG_IMAGE = "https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/files/og-image-1780497483684.jpg";
const ICON = "https://cdn.poehali.dev/files/81420758-6ed0-43fe-b7e7-c6317caea682.png";
const KEYWORDS =
    "ЛинэяСкул, lineaschool, LinaeSchool, linaeschool, LiniaSchool, liniaschool, LinyaSchool, linyaschool, LineSchool, lineschool, LinayaSchool, linayaschool, LineySchool, lineyschool, Линия Скул, ЛинияСкул, линия скул, линияскул, ЛинэаСкул, ЛинеаСкул, ЛинэяСкул, ЛиниаСкул, ЛиняСкул, ЛинаяСкул, ЛинейСкул, ЛиниСкул, ЛинаСкул, ЛиняСкул, Линэа Скул, Линеа Скул, Линэя Скул, Линиа Скул, Линя Скул, Линая Скул, Линей Скул, Лини Скул, Лина Скул, Линя Скул, линэа скул, линеа скул, линэя скул, линиа скул, линя скул, линая скул, линей скул, лини скул, лина скул, линя скул, дислексия, дисграфия, коррекция, онлайн обучение, дети, чтение, письмо";

const ORGANIZATION_LD = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "ЛинэяСкул",
    "legalName": "ЛинэяСкул",
    "brand": {
        "@type": "Brand",
        "name": "ЛинэяСкул",
        "alternateName": ["Линэя Скул", "Линия Скул", "ЛинияСкул", "LinaeSchool"],
    },
    "alternateName": ["Линэя Скул", "Линия Скул", "ЛинияСкул", "LinaeSchool", "LiniaSchool", "LinyaSchool", "LineSchool", "LinayaSchool", "LineySchool", "ЛинэаСкул", "ЛинеаСкул", "ЛиниаСкул", "ЛиняСкул", "ЛинаяСкул", "ЛинейСкул", "ЛиниСкул", "ЛинаСкул", "Линэа Скул", "Линеа Скул", "Линиа Скул", "Линя Скул", "Линая Скул", "Линей Скул", "Лини Скул", "Лина Скул"],
    "description": "Онлайн-школа коррекции дислексии и дисграфии для детей 8–18 лет. Диагностика чтения и письма, индивидуальный план коррекции, занятия с нейрологопедом по авторской методике.",
    "url": "https://lineaschool.ru",
    "logo": ICON,
    "sameAs": [],
    "address": {
        "@type": "PostalAddress",
        "addressCountry": "RU",
    },
    "offers": {
        "@type": "Offer",
        "description": "Профессиональная помощь детям с дислексией и дисграфией",
    },
};

const METRIKA = `(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=104031677', 'ym');
ym(104031677, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});`;

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {charSet: "utf-8"},
            {name: "viewport", content: "width=device-width, initial-scale=1.0"},
            {name: "google", content: "notranslate"},
            {name: "google-site-verification", content: "B6NEuG285XbMatU_kxZUewt3P8eFCGsCCfeIXw1TbYA"},
            {name: "yandex-verification", content: "781e54ccf04c5fd4"},
            {httpEquiv: "Content-Language", content: "ru"},
            {title: TITLE},
            {name: "description", content: DESCRIPTION},
            {name: "keywords", content: KEYWORDS},
            {name: "robots", content: "index, follow"},
            {name: "author", content: "ЛинэяСкул"},
            {name: "brand", content: "ЛинэяСкул"},
            {name: "organization", content: "ЛинэяСкул"},
            {name: "DC.title", content: "ЛинэяСкул — онлайн-школа коррекции дислексии"},
            {name: "DC.subject", content: "ЛинэяСкул, Линэя Скул, коррекция дислексии, дисграфия онлайн"},
            {name: "subject", content: "ЛинэяСкул — онлайн-школа коррекции дислексии и дисграфии"},
            {name: "abstract", content: "ЛинэяСкул (Линэя Скул) — профессиональная нейрологопедическая онлайн-школа. Бренд зарегистрирован в России."},
            {property: "og:title", content: TITLE},
            {property: "og:description", content: DESCRIPTION},
            {property: "og:type", content: "website"},
            {property: "og:url", content: "https://lineaschool.ru/"},
            {property: "og:image", content: OG_IMAGE},
            {property: "og:image:width", content: "1000"},
            {property: "og:image:height", content: "1000"},
            {property: "og:image:alt", content: "ЛинэяСкул - логотип с зеленым квадратом и белой книгой"},
            {property: "og:site_name", content: "ЛинэяСкул"},
            {property: "og:locale", content: "ru_RU"},
            {name: "twitter:card", content: "summary_large_image"},
            {name: "twitter:title", content: TITLE},
            {name: "twitter:description", content: DESCRIPTION},
            {name: "twitter:image", content: OG_IMAGE},
            ...PLATFORM_META,
        ],
        links: [
            {rel: "stylesheet", href: appCss},
            {rel: "icon", type: "image/x-icon", href: "/favicon.ico", sizes: "any"},
            {rel: "icon", type: "image/png", href: ICON, sizes: "16x16"},
            {rel: "icon", type: "image/png", href: ICON, sizes: "32x32"},
            {rel: "icon", type: "image/png", href: ICON, sizes: "512x512"},
            {rel: "apple-touch-icon", href: ICON},
            {rel: "shortcut icon", href: ICON},
        ],
        // IMPORTANT: DO NOT REMOVE PLATFORM SCRIPTS AND THE DEV HMR CLIENT!
        scripts: [
            ...(import.meta.env.DEV ? [{children: HMR_CLIENT}] : []),
            ...PLATFORM_SCRIPTS,
            {type: "application/ld+json", children: JSON.stringify(ORGANIZATION_LD)},
            {children: METRIKA},
        ],
    }),
    component: RootComponent,
    notFoundComponent: NotFound,
});

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin"/>
    </div>
);

function RootComponent() {
    // Запоминаем UTM-метки рекламной кампании при первом открытии сайта
    useEffect(() => {
        captureUtm();
    }, []);

    return (
        <RootDocument>
            <TooltipProvider>
                <Toaster/>
                <Sonner/>
                <BackToAdminHome/>
                <Suspense fallback={<PageLoader/>}>
                    <Outlet/>
                </Suspense>
            </TooltipProvider>
        </RootDocument>
    );
}

function RootDocument({children}: { children: ReactNode }) {
    return (
        <html lang="ru">
        <head>
            <HeadContent/>
        </head>
        <body>
        {children}
        <Scripts/>
        </body>
        </html>
    );
}
