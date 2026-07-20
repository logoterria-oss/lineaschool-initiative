import Icon from "@/components/ui/icon";
import Navigation from "@/components/Navigation";

const mainInfoRows: { label: string; value: React.ReactNode }[] = [
  {
    label: "Полное и сокращённое наименование образовательной организации",
    value:
      "Индивидуальный предприниматель Абраменко Виктория Алексеевна (ИП Абраменко В.А.)",
  },
  { label: "Дата создания образовательной организации", value: "29.08.2025 г." },
  {
    label: "Сведения об учредителе, учредителях образовательной организации",
    value: "нет",
  },
  {
    label: "Место нахождения образовательной организации",
    value:
      "630051, Новосибирская область, г.о. город Новосибирск, г. Новосибирск, тер. СНТ Золотая Горка, д. 82н",
  },
  {
    label: "Режим (график) работы",
    value: "Пн–Пт, с 09:00 до 18:00; Сб, Вс — выходные",
  },
  {
    label: "Контакты",
    value: (
      <>
        Телефон:{" "}
        <a href="tel:+79169822876" className="text-purple-700 hover:underline">
          +7 (916) 982-28-76
        </a>
        <br />
        Адрес эл. почты:{" "}
        <a
          href="mailto:lineaschool@mail.ru"
          className="text-purple-700 hover:underline"
        >
          lineaschool@mail.ru
        </a>
      </>
    ),
  },
  {
    label: "Места осуществления образовательной деятельности",
    value:
      "630051, Новосибирская область, г.о. город Новосибирск, г. Новосибирск, тер. СНТ Золотая Горка, д. 82н",
  },
  {
    label: "Лицензия на осуществление образовательной деятельности",
    value: (
      <>
        № Л035-01199-54/05474513 от 02 июля 2026 г.
        <br />
        Выписка из реестра лицензий на осуществление образовательной
        деятельности:{" "}
        <a
          href="https://disk.yandex.ru/i/9slIQlh0Dc-uKQ"
          target="_blank"
          rel="noreferrer"
          className="text-purple-700 hover:underline"
        >
          открыть
        </a>
      </>
    ),
  },
];

function MainInfo() {
  return (
    <dl className="divide-y divide-gray-100">
      {mainInfoRows.map((row) => (
        <div
          key={row.label}
          className="py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-4"
        >
          <dt className="font-semibold text-gray-700">{row.label}</dt>
          <dd className="mt-1 sm:mt-0 text-gray-600">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

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
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Сведения об образовательной организации
          </h1>
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
                {s.id === "main" ? <MainInfo /> : "Информация появится позже."}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}