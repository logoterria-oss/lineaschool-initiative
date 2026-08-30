/**
 * Лента со скидкой через правый верхний угол карточки.
 *
 * Полоса центрируется ровно на углу и поворачивается на 45°, поэтому её концы
 * свисают за карточку — как настоящая лента, наброшенная на угол. По краям
 * добавлены тёмные «загибы», уходящие за карточку.
 */
export default function DiscountRibbon({ percent }: { percent: number }) {
  return (
    <div className="pointer-events-none absolute top-[36px] right-[-56px] z-10 rotate-45">
      <div className="relative flex h-12 w-[190px] items-center justify-center bg-gradient-to-b from-red-500 via-red-600 to-red-800 shadow-lg">
        {/* Глянцевый блик по верхней половине */}
        <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent" />

        {/* Загибы на концах — уходят за карточку */}
        <span className="absolute -left-px top-0 h-full w-4 bg-red-900/70" />
        <span className="absolute -right-px top-0 h-full w-4 bg-red-900/70" />

        <span className="relative text-xl font-extrabold tracking-wide text-white drop-shadow-sm">
          −{percent}%
        </span>
      </div>
    </div>
  );
}