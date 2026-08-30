/**
 * Лента со скидкой, обвивающая правый верхний угол карточки.
 *
 * Полотно ленты лежит на самом углу, а по её концам видны короткие тёмные
 * загибы — лента как будто заворачивается за карточку. Рисуем в координатах
 * 100×100, где грани карточки проходят по y=12 и x=88: загибы уходят за них
 * наружу, вдоль краёв карточки.
 */
export default function DiscountRibbon({ percent }: { percent: number }) {
  const id = `ribbon-${percent}`;

  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute -top-[12px] -right-[12px] w-[100px] h-[100px]"
      aria-hidden
    >
      <defs>
        {/* Свет падает от угла: у внешней кромки лента светлее */}
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#b00505" />
          <stop offset="50%" stopColor="#e01010" />
          <stop offset="100%" stopColor="#ff3b3b" />
        </linearGradient>
      </defs>

      {/* Загибы уходят за карточку вдоль её краёв — они в тени */}
      <polygon points="30,12 30,4 20,12" fill="#7a0000" />
      <polygon points="88,70 96,70 88,80" fill="#7a0000" />

      {/* Полотно ленты через угол */}
      <polygon points="30,12 88,12 88,70" fill={`url(#${id})`} />

      {/* Блик по внешним кромкам */}
      <polygon points="30,12 88,12 88,17 35,17" fill="#ffffff" opacity="0.25" />
      <polygon points="88,12 88,70 83,70 83,17" fill="#ffffff" opacity="0.25" />

      <text
        x="63"
        y="37"
        transform="rotate(45 63 37)"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontSize="17"
        fontWeight="700"
      >
        −{percent}%
      </text>
    </svg>
  );
}
