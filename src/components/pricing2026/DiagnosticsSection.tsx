import { Card } from '@/components/ui/card';
import {
  DIAGNOSTIC_INTERIM,
  DIAGNOSTIC_PRIMARY,
  formatPrice,
  getPromoDeadline,
} from './data';

export default function DiagnosticsSection() {
  const promoDeadline = getPromoDeadline();

  return (
    <section className="mb-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Диагностика</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Первичная — со скидкой до конца месяца */}
        <Card className="relative p-6 border-2 border-green-500 shadow-lg flex flex-col">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              🔥 Акция до {promoDeadline}
            </span>
          </div>

          <div className="text-center mb-4 mt-2">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Первичная диагностика</h3>
            <p className="text-gray-600 text-sm mb-4">
              Полное обследование чтения и письма, консультация и индивидуальный план коррекции
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold text-green-600">
                {formatPrice(DIAGNOSTIC_PRIMARY.price)}
              </span>
              <span className="text-xl text-gray-400 line-through">
                {formatPrice(DIAGNOSTIC_PRIMARY.oldPrice)}
              </span>
            </div>
          </div>

          <div className="flex-grow" />
        </Card>

        {/* Промежуточная — контроль динамики */}
        <Card className="p-6 border-2 border-gray-200 flex flex-col">
          <div className="text-center mb-4 mt-2">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Промежуточная диагностика</h3>
            <p className="text-gray-600 text-sm mb-4">
              Контроль динамики в процессе обучения: что уже изменилось и куда двигаться дальше
            </p>
            <div className="flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(DIAGNOSTIC_INTERIM.price)}
              </span>
            </div>
          </div>

          <div className="flex-grow" />
        </Card>
      </div>
    </section>
  );
}