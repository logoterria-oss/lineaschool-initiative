import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

export default function HeroSection() {
  return (
    <section className="relative py-8 lg:py-12 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              🎓 Для детей 7-18 лет
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Онлайн-коррекция дислексии и дисграфии
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Уникальный комплексный нейрологопедический подход для успешного обучения вашего ребёнка
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button size="lg" className="bg-green-500 hover:bg-green-600 text-lg px-8 py-4">
                <Icon name="Calendar" className="mr-2" size={20} />
                Бесплатная диагностика
              </Button>
              <Button size="lg" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 text-lg px-8 py-4">
                <Icon name="Play" className="mr-2" size={20} />
                Смотреть видео
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">200+</div>
                <div className="text-sm text-gray-600">довольных семей</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">98%</div>
                <div className="text-sm text-gray-600">успешных кейсов</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">24/7</div>
                <div className="text-sm text-gray-600">поддержка</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <BeforeAfterSlider
              examples={[
                {
                  beforeImage: "https://cdn.poehali.dev/files/725de2f7-1ddd-4b52-b0a9-30cf01c3264b.jpg",
                  afterImage: "https://cdn.poehali.dev/files/01e04738-94b7-4b8f-b05c-efd09c13e969.jpg",
                  beforeAlt: "Письменная работа до коррекции",
                  afterAlt: "Письменная работа после коррекции"
                },
                {
                  beforeImage: "https://cdn.poehali.dev/files/32fa35dc-fd5c-408f-8566-f4d0bb8233a2.jpg",
                  afterImage: "https://cdn.poehali.dev/files/a1f4f9c7-ebc3-45e9-8a7c-1aa2ee8e3e12.jpg",
                  beforeAlt: "Чтение до коррекции",
                  afterAlt: "Чтение после коррекции"
                },
                {
                  beforeImage: "/img/174418b3-b55e-498b-8007-271ab951e7eb.jpg",
                  afterImage: "/img/6c81cc38-ecf7-43b0-af9d-5de785a0cca4.jpg",
                  beforeAlt: "Математика до коррекции",
                  afterAlt: "Математика после коррекции"
                },
                {
                  beforeImage: "/img/48f49395-68a6-46e4-99d8-fc5d9338a979.jpg",
                  afterImage: "/img/104206cb-4246-4e29-ab1b-5bdd8a92560e.jpg",
                  beforeAlt: "Общее развитие до",
                  afterAlt: "Общее развитие после"
                }
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}