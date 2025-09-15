import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: object;
}

export default function SEOHead({
  title = "Онлайн коррекция дислексии и дисграфии для детей | LineaSchool",
  description = "Эффективная онлайн-коррекция дислексии и дисграфии для детей 8-18 лет. Нейрологопедический подход, 200+ довольных семей, от 970₽ за урок. Бесплатная диагностика.",
  keywords = "дислексия, дисграфия, коррекция, логопед онлайн, нейрологопед, дети, обучение, дефектолог, нарушения чтения, нарушения письма",
  ogImage = "/img/2978ed56-825a-462e-a5cf-49f38aa64faf.jpg",
  canonicalUrl = "https://lineaschool.ru",
  structuredData
}: SEOHeadProps) {
  return (
    <Helmet>
      {/* Основные мета-теги */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="LineaSchool" />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="ru" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Favicon и иконки */}
      <link rel="icon" type="image/x-icon" href="/img/8b183cff-a78a-419e-9a70-f387836cf224.jpg" sizes="16x16" />
      <link rel="icon" type="image/png" href="/img/b3f6060c-fd50-4bee-a902-c9014256f6c2.jpg" sizes="32x32" />
      <link rel="icon" type="image/png" href="/img/fa2c674d-254c-4562-95f0-623e7733cfe0.jpg" sizes="512x512" />
      <link rel="apple-touch-icon" href="/img/fa2c674d-254c-4562-95f0-623e7733cfe0.jpg" />
      <link rel="shortcut icon" href="/img/8b183cff-a78a-419e-9a70-f387836cf224.jpg" />
      
      {/* Open Graph для соцсетей */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="LineaSchool" />
      <meta property="og:locale" content="ru_RU" />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Специальные теги для Яндекса */}
      <meta name="yandex-verification" content="" />
      <meta name="format-detection" content="telephone=no" />
      <meta property="ya:ovs:adult" content="false" />
      <meta property="ya:ovs:upload_date" content="2024-01-01" />
      <meta name="yandex-zen-verification" content="" />
      
      {/* Дополнительные теги для поисковиков */}
      <meta name="theme-color" content="#10b981" />
      <meta name="msapplication-TileColor" content="#10b981" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="LineaSchool" />
      
      {/* Структурированные данные */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}