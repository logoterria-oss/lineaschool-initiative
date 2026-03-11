import { useState, useEffect, useRef } from "react";

export const PORTRAIT =
  "https://cdn.poehali.dev/projects/ac059f9e-802b-4f7c-8586-eadc1391eb04/bucket/308d671a-c386-4099-a050-69c5916357a5.jpg";

export const NAV_ITEMS = [
  { id: "about", label: "О подходе" },
  { id: "services", label: "Услуги" },
  { id: "contact", label: "Контакты" },
  { id: "faq", label: "Вопросы" },
];

export const TASKS = [
  "Стратегические решения",
  "Пересборка роли",
  "Поведенческие паттерны",
  "Ментальные барьеры",
  "Коммуникации",
  "Эмоциональная устойчивость",
];

export const RESULTS = [
  "Ясность",
  "Спокойствие",
  "Стратегическое видение",
  "Устойчивость",
  "Внутренняя опора",
];

export const FAQ_ITEMS = [
  {
    q: "Как проходит установочная встреча?",
    a: "Установочная встреча длится 50 минут. Это разговор о вашем запросе, контексте и о том, как устроена работа. Формат — очный в Москве или онлайн.",
  },
  {
    q: "Сколько сессий обычно требуется?",
    a: "Количество встреч определяется индивидуально. Чаще всего работа выстраивается как регулярная — раз в одну-две недели. Минимальный эффективный период — 3 месяца.",
  },
  {
    q: "Какое у вас образование?",
    a: "Высшее образование по трём направлениям: управление персоналом, управление финансами, психология. Международный Executive-coach. Психоаналитическое бизнес-консультирование.",
  },
  {
    q: "Гарантируете ли вы конфиденциальность?",
    a: "Полностью. Всё, что обсуждается на сессиях, остаётся между нами. Это профессиональный и этический стандарт практики.",
  },
  {
    q: "Работаете ли вы с организациями и командами?",
    a: "Основной формат — индивидуальная работа с первым лицом или ключевым руководителем. Командные форматы рассматриваются отдельно.",
  },
  {
    q: "Как записаться на встречу?",
    a: "Напишите через контактную форму на сайте или в мессенджер. Я отвечаю в течение одного рабочего дня.",
  },
];

export function useInView(ref: React.RefObject<Element>, threshold = 0.12) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return inView;
}

export function useAnimSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref as React.RefObject<Element>);
  const style: React.CSSProperties = {
    transition: "opacity 0.7s ease, transform 0.7s ease",
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(28px)",
  };
  return { ref, style };
}