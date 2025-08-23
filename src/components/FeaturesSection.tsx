import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Почему выбирают нас?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Мы используем передовые методики и индивидуальный подход к каждому ребёнку
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-green-100 hover:shadow-lg transition-all duration-300 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Icon name="Target" size={24} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Индивидуальный подход</h3>
            <p className="text-gray-600">Персональная программа коррекции, учитывающая особенности каждого ребёнка</p>
          </Card>

          <Card className="border-green-100 hover:shadow-lg transition-all duration-300 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Icon name="Users" size={24} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Опытные специалисты</h3>
            <p className="text-gray-600">Команда сертифицированных логопедов и нейропсихологов</p>
          </Card>

          <Card className="border-green-100 hover:shadow-lg transition-all duration-300 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Icon name="Monitor" size={24} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Онлайн-формат</h3>
            <p className="text-gray-600">Удобные занятия из дома с интерактивными материалами</p>
          </Card>

          <Card className="border-green-100 hover:shadow-lg transition-all duration-300 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Icon name="BarChart" size={24} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Отслеживание прогресса</h3>
            <p className="text-gray-600">Регулярные отчеты о достижениях вашего ребёнка</p>
          </Card>

          <Card className="border-green-100 hover:shadow-lg transition-all duration-300 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Icon name="Heart" size={24} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Поддержка семьи</h3>
            <p className="text-gray-600">Консультации и рекомендации для родителей</p>
          </Card>

          <Card className="border-green-100 hover:shadow-lg transition-all duration-300 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Icon name="Award" size={24} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Гарантия результата</h3>
            <p className="text-gray-600">Возврат средств, если не увидите улучшений</p>
          </Card>
        </div>

        {/* Mobile List */}
        <div className="md:hidden space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="Target" size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Индивидуальный подход</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Персональная программа коррекции, учитывающая особенности каждого ребёнка</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="Users" size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Опытные специалисты</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Команда сертифицированных логопедов и нейропсихологов</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="Monitor" size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Онлайн-формат</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Удобные занятия из дома с интерактивными материалами</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 border border-orange-100">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="BarChart" size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Отслеживание прогресса</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Регулярные отчеты о достижениях вашего ребёнка</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-5 border border-pink-100">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="Heart" size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Поддержка семьи</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Консультации и рекомендации для родителей</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-5 border border-yellow-100">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="Award" size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Гарантия результата</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Возврат средств, если не увидите улучшений</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}