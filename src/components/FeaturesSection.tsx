import Icon from "@/components/ui/icon";

const FEATURES = [
  {
    icon: "Target",
    title: "Индивидуальный подход",
    text: "Персональная программа коррекции, учитывающая особенности каждого ребёнка",
    color: "from-green-400 to-emerald-600",
  },
  {
    icon: "Users",
    title: "Опытные специалисты",
    text: "Команда сертифицированных логопедов и нейропсихологов",
    color: "from-blue-400 to-cyan-600",
  },
  {
    icon: "Monitor",
    title: "Онлайн-формат",
    text: "Удобные занятия из дома с интерактивными материалами",
    color: "from-purple-400 to-indigo-600",
  },
  {
    icon: "BarChart",
    title: "Отслеживание прогресса",
    text: "Регулярные отчёты о достижениях вашего ребёнка",
    color: "from-orange-400 to-amber-600",
  },
  {
    icon: "Heart",
    title: "Поддержка семьи",
    text: "Консультации и рекомендации для родителей",
    color: "from-pink-400 to-rose-600",
  },
  {
    icon: "Award",
    title: "Гарантия результата",
    text: "Возврат средств, если не увидите улучшений",
    color: "from-teal-400 to-green-600",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-green-50/30 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900">Почему выбирают нас?</h2>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] gap-10 lg:gap-14 items-start">
          {/* Фото команды */}
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-green-200/50 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -right-4 w-40 h-40 bg-emerald-200/50 rounded-full blur-3xl" />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-green-100">
              <img
                src="/why-us.jpg"
                alt="Команда логопедов и нейропсихологов за работой"
                className="w-full h-full object-cover aspect-square"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-6">
                <div className="text-white">
                  <div className="text-lg font-semibold">Регулярные супервизии</div>
                  <div className="text-sm text-white/85">
                    Контроль качества проведения уроков от топовых специалистов
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3 bg-white rounded-2xl shadow-md px-5 py-4 border border-green-100">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Icon name="ShieldCheck" size={22} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Образовательная лицензия</div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    В работе используем только научно доказанные методики
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white rounded-2xl shadow-md px-5 py-4 border border-green-100">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-green-600 flex items-center justify-center flex-shrink-0">
                  <Icon name="Wallet" size={22} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Оплата маткапиталом</div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    100% стоимости занятий можно оплатить материнским капиталом
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Преимущества */}
          <div className="grid sm:grid-cols-2 gap-4 lg:gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group bg-white rounded-2xl p-5 border border-green-100 hover:border-green-300 hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon name={f.icon} size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}