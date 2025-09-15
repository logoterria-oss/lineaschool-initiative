// Структурированные данные для Google Rich Snippets

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "EducationalOrganization"],
  "name": "LineaSchool",
  "alternateName": ["Линия Скул", "ЛинияСкул", "LinaeSchool"],
  "description": "Онлайн коррекция дислексии и дисграфии для детей 8-18 лет",
  "url": "https://lineaschool.ru",
  "logo": {
    "@type": "ImageObject",
    "url": "https://lineaschool.ru/img/fa2c674d-254c-4562-95f0-623e7733cfe0.jpg",
    "width": 512,
    "height": 512
  },
  "image": "https://lineaschool.ru/img/2978ed56-825a-462e-a5cf-49f38aa64faf.jpg",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+7-923-625-16-11",
    "contactType": "customer service",
    "areaServed": "RU",
    "availableLanguage": ["Russian", "ru"]
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "RU"
  },
  "foundingDate": "2023",
  "sameAs": [
    "https://wa.me/79236251611"
  ]
};

export const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Коррекция дислексии и дисграфии онлайн",
  "description": "Онлайн-коррекция дислексии и дисграфии для детей 8-18 лет с использованием нейрологопедического подхода",
  "provider": {
    "@type": "Organization",
    "name": "LineaSchool"
  },
  "areaServed": {
    "@type": "Country",
    "name": "Russia"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Услуги коррекции",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Индивидуальные занятия по коррекции дислексии"
        },
        "price": "970",
        "priceCurrency": "RUB",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": "970",
          "priceCurrency": "RUB",
          "unitText": "урок 40 минут"
        }
      }
    ]
  }
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Что такое дислексия?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Дислексия — это специфическое нарушение способности к обучению чтению, не связанное с общим уровнем интеллекта ребёнка."
      }
    },
    {
      "@type": "Question", 
      "name": "В каком возрасте можно начинать коррекцию?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Мы работаем с детьми от 8 до 18 лет. Чем раньше начать коррекцию, тем эффективнее результат."
      }
    },
    {
      "@type": "Question",
      "name": "Сколько стоят занятия?",
      "acceptedAnswer": {
        "@type": "Answer", 
        "text": "Стоимость индивидуального урока от 970 рублей за 40 минут. Первая диагностика проводится бесплатно."
      }
    }
  ]
};

export const reviewSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "LineaSchool",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "200",
    "bestRating": "5",
    "worstRating": "1"
  }
};

export const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "LineaSchool - Онлайн коррекция дислексии и дисграфии",
  "description": "Эффективная онлайн-коррекция дислексии и дисграфии для детей 8-18 лет",
  "url": "https://lineaschool.ru",
  "isPartOf": {
    "@type": "WebSite",
    "name": "LineaSchool",
    "url": "https://lineaschool.ru"
  },
  "about": {
    "@type": "Thing",
    "name": "Коррекция дислексии и дисграфии"
  },
  "mainEntity": {
    "@type": "Organization",
    "name": "LineaSchool"
  }
};