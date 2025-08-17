import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Почему выбирают нас?</h2>

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      </div>
    </section>
  );
}