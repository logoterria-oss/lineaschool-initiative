import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: object;
}

export default function SEOHead({
  title = "Онлайн коррекция дислексии и дисграфии для детей | ЛинэяСкул",
  description = "Эффективная онлайн-коррекция дислексии и дисграфии для детей 8-18 лет. Нейрологопедический подход, 200+ довольных семей, от 970₽ за урок. Бесплатная диагностика.",
  keywords = "дислексия, дисграфия, коррекция, логопед онлайн, нейрологопед, дети, обучение, дефектолог, нарушения чтения, нарушения письма",
  ogImage = "/img/2978ed56-825a-462e-a5cf-49f38aa64faf.jpg",
  canonicalUrl = "https://lineaschool.ru",
  structuredData
}: SEOHeadProps) {
  useEffect(() => {
    document.title = title;

    const setMeta = (attr: string, value: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, value);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const setLink = (rel: string, href: string, extra?: Record<string, string>) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
      if (extra) Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
    };

    setMeta('name', 'description', description);
    setMeta('name', 'keywords', keywords);
    setMeta('name', 'author', 'ЛинэяСкул');
    setMeta('name', 'robots', 'index, follow');
    setMeta('http-equiv', 'Content-Language', 'ru');
    setMeta('name', 'format-detection', 'telephone=no');
    setMeta('name', 'theme-color', '#10b981');
    setMeta('name', 'msapplication-TileColor', '#10b981');
    setMeta('name', 'apple-mobile-web-app-capable', 'yes');
    setMeta('name', 'apple-mobile-web-app-status-bar-style', 'default');
    setMeta('name', 'apple-mobile-web-app-title', 'ЛинэяСкул');

    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:site_name', 'ЛинэяСкул');
    setMeta('property', 'og:locale', 'ru_RU');

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);

    setLink('canonical', canonicalUrl);

    const iconUrl = 'https://cdn.poehali.dev/files/81420758-6ed0-43fe-b7e7-c6317caea682.png';
    setLink('icon', iconUrl, { type: 'image/png' });
    setLink('apple-touch-icon', iconUrl);
    setLink('shortcut icon', iconUrl);

    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }
  }, [title, description, keywords, ogImage, canonicalUrl, structuredData]);

  return null;
}
