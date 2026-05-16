import { useEffect } from 'react';

export default function YandexMetaTags() {
  useEffect(() => {
    const setMeta = (attr: string, value: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, value);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta('name', 'yandex-verification', '');
    setMeta('name', 'yandex-zen-verification', '');
    setMeta('property', 'ya:ovs:adult', 'false');
    setMeta('property', 'ya:ovs:upload_date', '2024-01-01');
    setMeta('name', 'document-state', 'dynamic');
    setMeta('name', 'revisit-after', '1 days');
    setMeta('name', 'category', 'education');
    setMeta('name', 'subcategory', 'online-education');
    setMeta('name', 'geo.region', 'RU');
    setMeta('name', 'geo.placename', 'Россия');
    setMeta('name', 'rating', 'general');
    setMeta('name', 'distribution', 'global');
    setMeta('property', 'ya:ovs:content_rating', '6+');
    setMeta('property', 'article:author', 'ЛинэяСкул');
    setMeta('property', 'article:publisher', 'ЛинэяСкул');
  }, []);

  return null;
}
