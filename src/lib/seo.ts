// Мета-теги страницы для head() маршрута — то же, что раньше ставил
// компонент SEOHead через document в браузере, теперь уходит в HTML с сервера.

interface SeoOptions {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: object;
}

export function seoHead({
  title = 'Онлайн коррекция дислексии и дисграфии для детей | ЛинэяСкул',
  description = 'Эффективная онлайн-коррекция дислексии и дисграфии для детей 8-18 лет. Нейрологопедический подход, 200+ довольных семей, от 970₽ за урок. Бесплатная диагностика.',
  keywords = 'дислексия, дисграфия, коррекция, логопед онлайн, нейрологопед, дети, обучение, дефектолог, нарушения чтения, нарушения письма',
  ogImage = '/img/2978ed56-825a-462e-a5cf-49f38aa64faf.jpg',
  canonicalUrl = 'https://lineaschool.ru',
  structuredData,
}: SeoOptions) {
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'author', content: 'ЛинэяСкул' },
      { name: 'robots', content: 'index, follow' },
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'theme-color', content: '#10b981' },
      { name: 'msapplication-TileColor', content: '#10b981' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'ЛинэяСкул' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: ogImage },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:site_name', content: 'ЛинэяСкул' },
      { property: 'og:locale', content: 'ru_RU' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },
    ],
    links: [
      { rel: 'canonical', href: canonicalUrl },
    ],
    scripts: structuredData
      ? [{ type: 'application/ld+json', children: JSON.stringify(structuredData) }]
      : [],
  };
}

/** Метатеги для Яндекса — раньше их ставил компонент YandexMetaTags. */
export const YANDEX_META = [
  { name: 'yandex-zen-verification', content: '' },
  { property: 'ya:ovs:adult', content: 'false' },
  { property: 'ya:ovs:upload_date', content: '2024-01-01' },
  { name: 'document-state', content: 'dynamic' },
  { name: 'revisit-after', content: '1 days' },
  { name: 'category', content: 'education' },
  { name: 'subcategory', content: 'online-education' },
  { name: 'geo.region', content: 'RU' },
  { name: 'geo.placename', content: 'Россия' },
  { name: 'rating', content: 'general' },
  { name: 'distribution', content: 'global' },
  { property: 'ya:ovs:content_rating', content: '6+' },
  { property: 'article:author', content: 'ЛинэяСкул' },
  { property: 'article:publisher', content: 'ЛинэяСкул' },
];
