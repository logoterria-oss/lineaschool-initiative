import { Helmet } from 'react-helmet-async';

export default function YandexMetaTags() {
  return (
    <Helmet>
      {/* Яндекс.Вебмастер теги */}
      <meta name="yandex-verification" content="" />
      
      {/* Яндекс.Дзен */}
      <meta name="yandex-zen-verification" content="" />
      
      {/* Яндекс.Турбо страницы */}
      <link rel="yandex-tableau-widget" href="/turbo.xml" />
      
      {/* Микроразметка для Яндекса */}
      <meta property="ya:ovs:adult" content="false" />
      <meta property="ya:ovs:upload_date" content="2024-01-01" />
      
      {/* Дополнительные мета-теги для лучшей индексации */}
      <meta name="document-state" content="dynamic" />
      <meta name="revisit-after" content="1 days" />
      
      {/* Яндекс.Каталог */}
      <meta name="category" content="education" />
      <meta name="subcategory" content="online-education" />
      
      {/* Локализация для Яндекса */}
      <meta name="geo.region" content="RU" />
      <meta name="geo.placename" content="Россия" />
      
      {/* Контентные теги */}
      <meta name="rating" content="general" />
      <meta name="distribution" content="global" />
      
      {/* Дополнительные Open Graph теги специально для Яндекса */}
      <meta property="ya:ovs:content_rating" content="6+" />
      <meta property="article:author" content="ЛинэяСкул" />
      <meta property="article:publisher" content="ЛинэяСкул" />
    </Helmet>
  );
}