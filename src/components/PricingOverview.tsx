import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import BookingModal from "@/components/BookingModal";
import { Link } from "react-router-dom";

const plans = [
  {
    lessonsPerWeek: 2,
    title: "2 урока в неделю",
    severity: "Легкая степень выраженности",
    priceFrom: "1 150",
    lessonsPerMonth: 8,
    groupLessons: 4,
    individualLessons: 4,
    popular: false,
  },
  {
    lessonsPerWeek: 3,
    title: "3 урока в неделю",
    severity: "Средняя степень выраженности",
    priceFrom: "1 030",
    lessonsPerMonth: 12,
    groupLessons: 8,
    individualLessons: 4,
    popular: true,
  },
  {
    lessonsPerWeek: 4,
    title: "4 урока в неделю",
    severity: "Тяжелая степень выраженности",
    priceFrom: "970",
    lessonsPerMonth: 16,
    groupLessons: 8,
    individualLessons: 8,
    popular: false,
  },
];

export default function PricingOverview() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <section id="pricing-overview" className="py-20 bg-gradient-to-br from-green-50 via-white to-blue-50" translate="no">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Стоимость занятий</h2>
          <p className="text-xl text-gray-600">Прозрачные цены без скрытых платежей</p>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {plans.map((plan) => (
            <Card
              key={plan.lessonsPerWeek}
              className={`relative p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "border-2 border-blue-500 shadow-lg"
                  : "border border-gray-200 shadow-sm"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-md">
                    Популярный
                  </span>
                </div>
              )}

              <div className="text-center pt-2">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.severity}</p>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-green-600">от {plan.priceFrom} &#8381;</span>
                  <span className="text-gray-500 text-sm ml-1">за урок</span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Icon name="CalendarDays" size={16} className="text-green-600 flex-shrink-0" />
                    <span>{plan.lessonsPerMonth} уроков в месяц</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Icon name="Users" size={16} className="text-blue-500 flex-shrink-0" />
                    <span>{plan.groupLessons} групповых</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Icon name="User" size={16} className="text-green-600 flex-shrink-0" />
                    <span>{plan.individualLessons} индивидуальных</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-4">
          <Link to="/price">
            <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 text-base px-8 py-5">
              Подробнее о тарифах
              <Icon name="ArrowRight" size={18} className="ml-2" />
            </Button>
          </Link>

        </div>
      </div>

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </section>
  );
}