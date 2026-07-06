import Icon from "@/components/ui/icon";

const schoolLinks = [
  { label: "Методика", href: "#methodology" },
  { label: "Преимущества", href: "#features" },
  { label: "Диагностика", href: "#diagnostic" },
  { label: "Отзывы", href: "#testimonials" },
  { label: "Цены", href: "#pricing" },
  { label: "Вопросы", href: "#faq" },
];

export default function SectionsNav() {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-green-100 sticky top-14 sm:top-16 md:top-20 lg:top-24 z-40">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 py-2 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-green-700 font-semibold text-sm">
              <Icon name="GraduationCap" size={18} className="text-green-600" />
              Онлайн-школа ЛинэяСкул
            </span>
            <nav className="flex items-center gap-3 flex-wrap ml-1">
              {schoolLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-[13px] text-gray-500 hover:text-green-600 transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </div>

          <a
            href="/lineastudies"
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium sm:ml-auto"
          >
            <Icon name="FlaskConical" size={18} className="text-blue-500" />
            Научно-исследовательский центр ЛинэяСтадис
          </a>
        </div>
      </div>
    </div>
  );
}
