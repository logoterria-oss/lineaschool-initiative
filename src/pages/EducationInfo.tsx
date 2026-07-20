import Icon from "@/components/ui/icon";
import NavigationWithoutBooking from "@/components/NavigationWithoutBooking";

const sections = [
  { id: "main", title: "Основные сведения", icon: "Info" },
  {
    id: "structure",
    title: "Структура и органы управления образовательной организацией",
    icon: "Network",
  },
  { id: "documents", title: "Документы", icon: "FileText" },
  { id: "education", title: "Образование", icon: "GraduationCap" },
  { id: "management", title: "Руководство", icon: "UserCog" },
  { id: "staff", title: "Педагогический состав", icon: "Users" },
  {
    id: "facilities",
    title:
      "Материально-техническое обеспечение и оснащенность образовательного процесса. Доступная среда",
    icon: "Building2",
  },
  {
    id: "paid-services",
    title: "Платные образовательные услуги",
    icon: "Wallet",
  },
  {
    id: "finance",
    title: "Финансово-хозяйственная деятельность",
    icon: "TrendingUp",
  },
  {
    id: "vacancies",
    title: "Вакантные места для приема (перевода) обучающихся",
    icon: "UserPlus",
  },
  {
    id: "support",
    title: "Стипендии и меры поддержки обучающихся",
    icon: "HandHeart",
  },
  {
    id: "international",
    title: "Международное сотрудничество",
    icon: "Globe",
  },
  {
    id: "meals",
    title: "Организация питания в образовательной организации",
    icon: "Utensils",
  },
];

export default function EducationInfo() {
  return (
    <div className="min-h-screen bg-gradient-to-bl from-purple-50 via-white to-purple-50/30">
      <NavigationWithoutBooking />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg mx-auto">
            <Icon name="School" size={32} className="text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Сведения об образовательной организации
          </h1>
          <p className="text-gray-500">
            Нажмите на раздел, чтобы развернуть подробную информацию.
          </p>
        </div>

        <div className="space-y-3">
          {sections.map((s, i) => (
            <details
              key={s.id}
              className="group bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
            >
              <summary className="list-none cursor-pointer select-none flex items-center gap-3 p-4 sm:p-5 hover:bg-purple-50/60 transition-colors">
                <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-purple-100 text-purple-700 font-semibold flex items-center justify-center text-sm">
                  {i + 1}
                </span>
                <Icon
                  name={s.icon}
                  size={18}
                  className="text-purple-600 flex-shrink-0 hidden sm:block"
                />
                <span className="flex-1 text-sm sm:text-base font-semibold text-gray-800">
                  {s.title}
                </span>
                <Icon
                  name="ChevronDown"
                  size={20}
                  className="text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-gray-100 text-gray-500 text-sm leading-relaxed">
                Информация появится позже.
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
