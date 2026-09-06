import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { Link } from "react-router-dom";
import { pricingSections } from "@/components/pricing2026/data";

/**
 * Краткий блок цен на главной. Цифры не дублируются руками, а считаются из
 * общих данных тарифов — чтобы главная и страница цен не расходились.
 */
/** Степень выраженности нарушения — растёт вместе с числом уроков в неделю. */
const severityBadges = ["Лёгкая степень", "Средняя степень", "Тяжёлая степень"];

const overviewPlans = pricingSections.map((section, index) => {
  const monthPlan = section.plans[0];
  const minPricePerLesson = Math.min(...section.plans.map((p) => p.pricePerLesson));

  return {
    title: section.title,
    severity: severityBadges[index],
    cases: Array.isArray(section.description) ? section.description : [section.description],
    priceFrom: minPricePerLesson,
    lessonsPerMonth: monthPlan.groupLessons + monthPlan.individualLessons,
    groupLessons: monthPlan.groupLessons,
    individualLessons: monthPlan.individualLessons,
    popular: index === 1,
  };
});

export default function PricingOverview() {
  return (
    <section
      id="pricing-overview"
      className="py-20 bg-gradient-to-br from-green-50 via-white to-blue-50"
      translate="no"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Стоимость занятий</h2>
          <p className="text-xl text-gray-600">Прозрачные цены без скрытых платежей</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-stretch">
          {overviewPlans.map((plan) => (
            <Card
              key={plan.title}
              className={`relative p-6 flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "border-2 border-blue-500 shadow-lg"
                  : "border border-gray-200 shadow-sm"
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                  {plan.severity}
                </span>
              </div>

              <div className="text-center pt-2">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{plan.title}</h3>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-green-600">
                    от {plan.priceFrom.toLocaleString("ru-RU")} &#8381;
                  </span>
                  <span className="text-gray-500 text-sm ml-1">за урок</span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-left">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Icon name="CalendarDays" size={16} className="text-green-600 flex-shrink-0" />
                    <span>{plan.lessonsPerMonth} уроков в месяц</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Icon name="Users" size={16} className="text-blue-500 flex-shrink-0" />
                    <span>{plan.groupLessons} групповых</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-sm text-gray-700 ${
                      plan.individualLessons > 0 ? "" : "invisible"
                    }`}
                    aria-hidden={plan.individualLessons === 0}
                  >
                    <Icon name="User" size={16} className="text-blue-500 flex-shrink-0" />
                    <span>{plan.individualLessons} индивидуальных</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 text-left">
                <p className="text-xs font-semibold text-gray-500 mb-2">Кому подходит:</p>
                <ul className="space-y-1.5">
                  {plan.cases.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-gray-600">
                      <Icon
                        name="Check"
                        size={14}
                        className="text-green-500 flex-shrink-0 mt-0.5"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/price_2026-2027">
            <Button
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 text-base px-8 py-5"
            >
              Подробнее о тарифах
              <Icon name="ArrowRight" size={18} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}