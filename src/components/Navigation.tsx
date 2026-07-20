import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import BookingModal from "@/components/BookingModal";

const mobileMenu = [
  {
    title: "Онлайн-школа коррекции дислексии и дисграфии",
    links: [
      { label: "Методика нейрологопедической коррекции", href: "#methodology" },
      { label: "Диагностика процессов чтения и письма", href: "#diagnostic" },
      { label: "Отзывы о школе", href: "#testimonials" },
      { label: "Стоимость обучения", href: "#pricing" },
      { label: "Часто задаваемые вопросы", href: "#faq" },
      { label: "Сведения об образовательной организации", href: "/sveden" },
    ],
  },
  {
    title: "Институт прикладных исследований чтения и письма",
    links: [{ label: "О центре", href: "/lineastudies" }],
  },
];

export default function Navigation() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
    <nav className="bg-white/95 backdrop-blur-md shadow-md border-b border-green-200 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-0 lg:px-0">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20 lg:h-24">
          <button
            type="button"
            aria-label="Меню"
            onClick={() => setIsMenuOpen((v) => !v)}
            className="md:hidden order-1 p-2 text-gray-600 hover:text-green-600 transition-colors flex-shrink-0"
          >
            <Icon name={isMenuOpen ? "X" : "Menu"} size={26} />
          </button>
          <a href="/" className="flex items-center space-x-2 xs:space-x-2.5 sm:space-x-3 md:space-x-6 min-w-0 flex-shrink overflow-hidden order-2 md:order-1">
            <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-green-600 truncate order-1 md:order-2 md:ml-4">ЛинэяСкул</span>
            <div className="w-11 h-11 xs:w-12 xs:h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 order-2 md:order-1">
              <Icon name="BookOpen" size={22} className="text-white xs:w-6 xs:h-6 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
            </div>
          </a>
          <div className="hidden md:flex items-center space-x-3 lg:space-x-6 flex-shrink-0 order-2">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white text-sm lg:text-lg px-4 lg:px-8 py-2 lg:py-4 transition-all duration-300"
              onClick={() => window.open('https://t.me/logoterria?text=Здравствуйте!%20У%20меня%20есть%20вопрос%20по%20коррекции%20дислексии%20и%20дисграфии', '_blank')}
            >
              Задать вопрос
            </Button>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-sm lg:text-lg px-4 lg:px-8 py-2 lg:py-4 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => setIsBookingModalOpen(true)}
            >
              Записаться
            </Button>
            <a
              href="/admin/role-select"
              className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200 rounded-lg hover:bg-green-50 flex-shrink-0"
              title="Войти в систему"
            >
              <Icon name="Settings" size={20} />
            </a>
          </div>

        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
          <div className="px-4 py-3 space-y-4">
            {mobileMenu.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-semibold lowercase text-gray-800 mb-1.5">
                  {group.title}
                </p>
                <div className="flex flex-col">
                  {group.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-2 pl-3 text-sm lowercase text-gray-600 hover:text-green-600 transition-colors"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
      />
    </nav>
    </>
  );
}