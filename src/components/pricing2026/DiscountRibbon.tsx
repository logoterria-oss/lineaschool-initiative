/**
 * Уголок со скидкой в правом верхнем углу карточки — красная лента,
 * «загнутая» через угол. Внешний блок обрезает всё лишнее по скруглению
 * карточки, внутренний повёрнут на 45° и выходит за края.
 */
export default function DiscountRibbon({ percent }: { percent: number }) {
  return (
    <div className="pointer-events-none absolute top-0 right-0 w-28 h-28 overflow-hidden rounded-tr-xl">
      <div className="absolute top-[26px] right-[-38px] w-[140px] rotate-45 bg-gradient-to-b from-red-500 to-red-700 py-1.5 text-center text-sm font-bold tracking-wide text-white shadow-md">
        −{percent}%
      </div>
    </div>
  );
}
