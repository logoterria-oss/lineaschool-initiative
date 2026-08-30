/**
 * Уголок со скидкой — красная лента, перекинутая через правый верхний угол
 * карточки. Рисуем на SVG: сама лента идёт по диагонали, а по краям видны
 * тёмные «загибы», как будто она заворачивается за карточку.
 */
export default function DiscountRibbon({ percent }: { percent: number }) {
  const id = `ribbon-${percent}`;

  return (
    <svg
      viewBox="0 0 112 112"
      className="pointer-events-none absolute -top-[13px] -right-[13px] w-28 h-28"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff4d4d" />
          <stop offset="55%" stopColor="#e11d1d" />
          <stop offset="100%" stopColor="#a80000" />
        </linearGradient>
      </defs>

      {/* Загибы ленты за карточку — тёмные, лежат под основной полосой */}
      <polygon points="16,0 3,0 16,13" fill="#7f0000" />
      <polygon points="112,96 112,109 99,96" fill="#7f0000" />

      {/* Основная полоса через угол */}
      <polygon points="16,0 52,0 112,60 112,96" fill={`url(#${id})`} />

      {/* Блик вдоль верхнего края полосы */}
      <polygon points="16,0 22,0 112,90 112,96" fill="#ffffff" opacity="0.18" />

      <text
        x="70"
        y="42"
        transform="rotate(45 70 42)"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontSize="17"
        fontWeight="700"
        letterSpacing="0.5"
      >
        −{percent}%
      </text>
    </svg>
  );
}