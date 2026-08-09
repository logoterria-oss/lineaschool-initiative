const schoolLinks = [
  { label: "Методика нейрологопедической коррекции", href: "#methodology" },
  { label: "Диагностика процессов чтения и письма", href: "#diagnostic" },
  { label: "Отзывы о школе", href: "#testimonials" },
  { label: "Стоимость обучения", href: "#pricing" },
  { label: "Часто задаваемые вопросы", href: "#faq" },
  { label: "Сведения об образовательной организации", href: "/sveden" },
];

const studiesLinks = [{ label: "О центре", href: "/lineastudies" }];

function NavDropdown({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <details className="group relative">
      <summary className="list-none cursor-pointer select-none whitespace-nowrap text-sm font-medium lowercase text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1">
        {title}
        <span className="text-[10px] text-gray-400 transition-transform group-open:rotate-180">
          ▼
        </span>
      </summary>
      <div className="absolute left-0 top-full mt-2 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="block px-4 py-2 text-sm lowercase text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            {l.label}
          </a>
        ))}
      </div>
    </details>
  );
}

export default function SectionsNav() {
  return (
    <div className="hidden md:block bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-14 sm:top-16 md:top-20 lg:top-24 z-40">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Названия разделов длинные и набраны строчными: без заметного
            промежутка и разделителя они читаются как одна фраза.
            Отступ растёт с шириной экрана, на узких — перенос в столбик. */}
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-1 py-2.5 lg:gap-x-16 xl:gap-x-24">
          <NavDropdown
            title="Онлайн-школа коррекции дислексии и дисграфии"
            links={schoolLinks}
          />
          <span aria-hidden className="hidden h-4 w-px bg-gray-200 md:block" />
          <NavDropdown
            title="Институт прикладных исследований чтения и письма"
            links={studiesLinks}
          />
        </div>
      </div>
    </div>
  );
}