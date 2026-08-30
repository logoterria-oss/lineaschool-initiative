/**
 * Лента со скидкой на правом верхнем углу карточки.
 *
 * Координаты 130×130: угол карточки — точка (110, 20), верхняя грань идёт
 * влево по y=20, правая — вниз по x=110. Полотно ленты накрывает угол, а по
 * её концам выступают короткие загибы: лента уходит за карточку.
 */
export default function DiscountRibbon({ percent }: { percent: number }) {
  const id = `ribbon-${percent}`;
  const gloss = `${id}-gloss`;

  return (
    <svg
      viewBox="0 0 130 130"
      className="pointer-events-none absolute -top-[20px] -right-[20px] w-[130px] h-[130px] drop-shadow-md"
      aria-hidden
    >
      <defs>
        {/* Поперёк ленты: блик у внешней кромки, тень у внутренней */}
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#c40000" />
          <stop offset="45%" stopColor="#ee0000" />
          <stop offset="85%" stopColor="#ff1a1a" />
          <stop offset="100%" stopColor="#ff8a8a" />
        </linearGradient>
        <linearGradient id={gloss} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Загибы за карточку — уходят в тень */}
      <polygon points="40,20 40,8 28,20" fill="#8c0000" />
      <polygon points="110,90 122,102 110,102" fill="#8c0000" />

      {/* Полотно ленты через угол */}
      <polygon points="40,20 110,20 110,90" fill={`url(#${id})`} />

      {/* Глянец вдоль верхней грани */}
      <polygon points="40,20 110,20 110,32 52,32" fill={`url(#${gloss})`} />

      <text
        x="83"
        y="43"
        transform="rotate(45 83 43)"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontSize="18"
        fontWeight="800"
      >
        −{percent}%
      </text>
    </svg>
  );
}
