/**
 * Лента со скидкой на правом верхнем углу карточки.
 *
 * Готовая картинка от дизайнера: угол ленты совпадает с углом карточки,
 * загибы по краям выходят чуть за него.
 */
const RIBBONS: Record<number, string> = {
  10: '/ribbon-10.png',
};

export default function DiscountRibbon({ percent }: { percent: number }) {
  const src = RIBBONS[percent];
  if (!src) return null;

  return (
    <img
      src={src}
      alt={`Скидка ${percent}%`}
      className="pointer-events-none absolute -top-1 -right-1 w-24 h-24 select-none"
    />
  );
}
