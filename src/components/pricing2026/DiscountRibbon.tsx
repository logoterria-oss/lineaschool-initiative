/**
 * Уголок со скидкой — широкая красная лента, перекинутая через правый верхний
 * угол карточки, с загнутыми «хвостами» по краям.
 *
 * Рисуем на SVG в системе координат 120×120, где угол карточки находится в
 * точке (106, 14). Сам блок смещён на 14px вверх и вправо, поэтому хвосты
 * выходят за карточку и лента выглядит наброшенной сверху.
 */
export default function DiscountRibbon({ percent }: { percent: number }) {
  const id = `ribbon-${percent}`;

  return (
    <svg
      viewBox="0 0 120 120"
      className="pointer-events-none absolute -top-[16px] -right-[16px] w-[136px] h-[136px]"
      aria-hidden
    >
      <defs>
        {/* Свет падает со стороны угла: у верхней кромки лента светлее */}
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#a00000" />
          <stop offset="45%" stopColor="#e00000" />
          <stop offset="85%" stopColor="#ff2020" />
          <stop offset="100%" stopColor="#ff7070" />
        </linearGradient>
      </defs>

      {/* Хвосты — уходят за карточку, поэтому тёмные */}
      <polygon points="18,14 18,0 32,14" fill="#8f0000" />
      <polygon points="106,102 120,102 106,116" fill="#8f0000" />

      {/* Полотно ленты через угол */}
      <polygon points="18,14 70,14 106,50 106,102" fill={`url(#${id})`} />

      {/* Блик вдоль верхней кромки */}
      <polygon points="70,14 106,50 106,42 78,14" fill="#ffffff" opacity="0.35" />

      <text
        x="72"
        y="48"
        transform="rotate(45 72 48)"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontSize="20"
        fontWeight="700"
      >
        −{percent}%
      </text>
    </svg>
  );
}