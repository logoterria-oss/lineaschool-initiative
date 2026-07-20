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
    value: "Пн–Вс, с 8:00 до 21:00 (Мск, UTC+3)",
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

const structureInfoRows: { label: string; value: React.ReactNode }[] = [
  {
    label: "Руководитель образовательной организации",
    value: "Абраменко Виктория Алексеевна",
  },
  { label: "Структурные подразделения и филиалы", value: "нет" },
];

function DocLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-purple-700 hover:underline"
    >
      открыть
    </a>
  );
}

const documentsRows: { label: string; value: React.ReactNode }[] = [
  { label: "Устав образовательной организации", value: "не предусмотрен" },
  {
    label: "Выписка из ЕГРИП",
    value: <DocLink href="https://disk.yandex.ru/i/Kbq2Vg-Df-u1xw" />,
  },
  {
    label: "Правила внутреннего распорядка обучающихся",
    value: <DocLink href="https://disk.yandex.ru/i/aEn2ia2n7WkwXQ" />,
  },
  {
    label: "Правила внутреннего трудового распорядка",
    value: <DocLink href="https://disk.yandex.ru/i/D_tR_y7_ul1LxA" />,
  },
  { label: "Коллективный договор", value: "не предусмотрен" },
  {
    label:
      "Локальные нормативные акты образовательной организации по основным вопросам организации и осуществления образовательной деятельности",
    value: "информация появится позже",
  },
  { label: "Отчёт о результатах самообследования", value: "в разработке" },
  {
    label:
      "Предписания органов, осуществляющих государственный контроль (надзор) в сфере образования, отчёты об исполнении таких предписаний",
    value: "не предусмотрены",
  },
];

const educationRows: { label: string; value: React.ReactNode }[] = [
  {
    label: "Дополнительная общеобразовательная программа",
    value: (
      <>
        Дополнительная общеразвивающая программа «Скорочтение».{" "}
        <DocLink href="https://disk.yandex.ru/i/KOsQ4N-MXzSc4w" />
      </>
    ),
  },
  {
    label: "Форма обучения",
    value:
      "Заочная, с применением исключительно электронного обучения, дистанционных образовательных технологий",
  },
  { label: "Нормативный срок обучения", value: "16 часов" },
  {
    label:
      "Численность обучающихся по реализуемым образовательным программам за счёт бюджетных ассигнований федерального бюджета, бюджетов субъектов Российской Федерации, местных бюджетов",
    value: "не имеются",
  },
  {
    label:
      "Численность обучающихся по реализуемым образовательным программам по договорам об образовании за счёт средств физических и (или) юридических лиц",
    value: "информация появится позже",
  },
  {
    label: "Численность обучающихся, являющихся иностранными гражданами",
    value: "не имеются",
  },
  {
    label: "Язык образования",
    value: (
      <>
        Обучение ведётся на русском языке.{" "}
        <DocLink href="https://disk.yandex.ru/i/a5mzv9PQb6ddAA" />
      </>
    ),
  },
];

const managementRows: { label: string; value: React.ReactNode }[] = [
  {
    label: "Руководитель образовательной организации",
    value: "Абраменко Виктория Алексеевна",
  },
  {
    label: "Контакты",
    value: (
      <>
        Телефон:{" "}
        <a href="tel:+79236251611" className="text-purple-700 hover:underline">
          +7 (923) 625-1611
        </a>
        <br />
        Адрес эл. почты:{" "}
        <a
          href="mailto:abram.viktoriya.00@mail.ru"
          className="text-purple-700 hover:underline"
        >
          abram.viktoriya.00@mail.ru
        </a>
      </>
    ),
  },
];

function InfoRows({
  rows,
}: {
  rows: { label: string; value: React.ReactNode }[];
}) {
  return (
    <dl className="divide-y divide-gray-100">
      {rows.map((row) => (
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

function PaidServicesInfo() {
  return (
    <div className="space-y-3">
      <p>Образовательные услуги у ИП Абраменко В.А. являются платными.</p>
      <InfoRows
        rows={[
          {
            label: "Положение о порядке оказания платных услуг",
            value: <DocLink href="https://disk.yandex.ru/i/euxuNY9do1H2Hw" />,
          },
          {
            label:
              "Образец договора об оказании платных образовательных услуг с физическим лицом",
            value: <DocLink href="https://disk.yandex.ru/i/DBdR7roMz5FeGg" />,
          },
          {
            label:
              "Приказ об утверждении стоимости обучения по каждой образовательной программе",
            value: <DocLink href="https://disk.yandex.ru/i/5gNZgQ34qJSMnQ" />,
          },
        ]}
      />
    </div>
  );
}

const financeRows: { label: string; value: React.ReactNode }[] = [
  {
    label:
      "Образовательная деятельность, финансовое обеспечение которой осуществляется за счёт бюджетных ассигнований федерального бюджета, бюджетов субъектов Российской Федерации, местных бюджетов",
    value: "не реализуется",
  },
  {
    label:
      "Образовательная деятельность, финансовое обеспечение которой осуществляется по договорам об образовании за счёт средств физических лиц",
    value: "100%",
  },
  {
    label:
      "Информация о поступлении и расходовании финансовых и материальных средств по итогам финансового года",
    value: "в разработке",
  },
  {
    label:
      "Копия плана финансово-хозяйственной деятельности образовательной организации, утверждённого в установленном законодательством Российской Федерации порядке, или бюджетной сметы образовательной организации",
    value: "в разработке",
  },
];

const facilitiesRows: { label: string; value: React.ReactNode }[] = [
  {
    label: "Наличие оборудованных учебных кабинетов",
    value:
      "не предусмотрено, так как обучение ведётся с применением исключительно электронного обучения, дистанционных образовательных технологий",
  },
  {
    label: "Наличие оборудованных объектов для проведения практических занятий",
    value:
      "не предусмотрено, так как обучение ведётся с применением исключительно электронного обучения, дистанционных образовательных технологий",
  },
  { label: "Наличие оборудованных библиотек", value: "не предусмотрено" },
  { label: "Наличие оборудованных объектов спорта", value: "не предусмотрено" },
  {
    label: "Наличие оборудованных средств обучения и воспитания",
    value: "не предусмотрено",
  },
  {
    label:
      "Доступ к информационным системам и информационно-телекоммуникационным сетям",
    value: "не предусмотрено",
  },
  {
    label:
      "Электронные образовательные ресурсы, к которым обеспечивается доступ обучающихся",
    value:
      "Система электронного обучения на платформе для онлайн-обучения Antitreningi",
  },
  {
    label:
      "Количество жилых помещений в общежитии, интернате, формирование платы за проживание в общежитии",
    value: "не предусмотрено",
  },
];

function FacilitiesInfo() {
  return (
    <div className="space-y-5">
      <div>
        <p className="font-semibold text-gray-800 mb-2">
          1. Материально-техническое обеспечение образовательной деятельности,
          в том числе в отношении инвалидов и лиц с ОВЗ
        </p>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>
            Ноутбук Lenovo ThinkBook 15-IIL 205M000HIRU (четырёхъядерный процессор
            Intel Core i5-1035G1 с частотой 1.0–3.6 ГГц, оперативная память DDR4
            16384 Мб, SSD 512 Гб)
          </li>
          <li>Веб-камера</li>
          <li>Наушники Hoco W35 Global, чёрный — 1 шт.</li>
          <li>Микрофон ME6 — 1 шт.</li>
        </ul>
        <InfoRows rows={facilitiesRows} />
      </div>
      <div>
        <p className="font-semibold text-gray-800 mb-2">
          2. Специальные условия для получения образования инвалидами и лицами с
          ограниченными возможностями здоровья
        </p>
        <p>
          Электронная обучающая среда отвечает установленным требованиям
          законодательства. Обучение проводится дистанционно, что обеспечивает
          беспрепятственный доступ к обучению для лиц с ограниченными
          возможностями здоровья.
        </p>
      </div>
    </div>
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
                {s.id === "main" ? (
                  <InfoRows rows={mainInfoRows} />
                ) : s.id === "structure" ? (
                  <InfoRows rows={structureInfoRows} />
                ) : s.id === "documents" ? (
                  <InfoRows rows={documentsRows} />
                ) : s.id === "education" ? (
                  <InfoRows rows={educationRows} />
                ) : s.id === "management" ? (
                  <InfoRows rows={managementRows} />
                ) : s.id === "facilities" ? (
                  <FacilitiesInfo />
                ) : s.id === "paid-services" ? (
                  <PaidServicesInfo />
                ) : s.id === "finance" ? (
                  <InfoRows rows={financeRows} />
                ) : (
                  "Информация появится позже."
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}