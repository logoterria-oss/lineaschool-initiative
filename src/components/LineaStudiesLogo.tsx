import Icon from "@/components/ui/icon";

/**
 * Эмблема ЛинэяСтадис: книга ЛинэяСкул + лупа исследовательского центра.
 * Один компонент на шапку и на центр страницы — пропорции лупы к квадрату
 * (≈45%) заданы здесь, поэтому в любом размере эмблема выглядит одинаково.
 */
export default function LineaStudiesLogo({ variant = "header" }: { variant?: "header" | "hero" }) {
  const isHero = variant === "hero";

  const box = isHero
    ? "w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-3xl"
    : "w-11 h-11 xs:w-12 xs:h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg";

  const bookSize = isHero
    ? "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
    : "w-[22px] h-[22px] xs:w-6 xs:h-6 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8";

  const badge = isHero
    ? "w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 -bottom-2 -right-2 ring-[3px]"
    : "w-5 h-5 xs:w-[22px] xs:h-[22px] sm:w-6 sm:h-6 md:w-[26px] md:h-[26px] lg:w-7 lg:h-7 -bottom-1 -right-1 ring-2";

  const glassSize = isHero
    ? "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
    : "w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-[18px] lg:h-[18px]";

  return (
    <div className={`relative flex-shrink-0 ${box}`}>
      <div className={`w-full h-full bg-green-500 flex items-center justify-center shadow-lg ${isHero ? "rounded-3xl" : "rounded-lg"}`}>
        <Icon name="BookOpen" className={`text-white ${bookSize}`} />
      </div>
      <div
        className={`absolute bg-white rounded-full flex items-center justify-center shadow-md ring-green-500 ${badge}`}
      >
        <Icon name="Search" className={`text-green-600 ${glassSize}`} />
      </div>
    </div>
  );
}
