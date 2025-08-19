import { Card, CardContent } from "@/components/ui/card";

const specialists = [
  {
    name: "Виктория Абраменко",
    role: "Логопед-нейропсихолог",
    description: "Руководитель центра, диагност, супервизор, автор методических материалов и научных статей",
    avatar: "https://cdn.poehali.dev/files/00f8a984-4db0-4798-a44e-25454f9fdb47.jpg"
  },
  {
    name: "Анастасия Найденова", 
    role: "Логопед-нейропсихолог",
    description: "Специалист по комплексной диагностике и коррекции",
    avatar: "https://cdn.poehali.dev/files/39e06528-df6e-46ad-a501-a6a4de01c57e.jpg"
  },
  {
    name: "Мила Яровець",
    role: "Логопед",
    description: "Специалист по коррекции дислексии и дисграфии у младших школьников",
    avatar: "https://cdn.poehali.dev/files/b6aa3ad4-6e9c-4fe1-8741-3009f1cf33c2.jpg"
  },
  {
    name: "Дарья Еремина",
    role: "Логопед", 
    description: "Специалист по коррекции дислексии и дисграфии у старших школьников",
    avatar: "https://cdn.poehali.dev/files/093e20f2-e0ae-4a2e-9d50-61e102662d3e.jpg"
  }
];

export default function SpecialistsSection() {
  return (
    <section id="specialists" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Наши специалисты</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Команда профессионалов с многолетним опытом работы
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {specialists.map((specialist, index) => (
            <Card key={index} className="border-green-100 hover:shadow-lg transition-all duration-300 text-center">
              <CardContent className="p-6">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden ring-2 ring-green-200">
                  <img 
                    src={specialist.avatar} 
                    alt={specialist.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{specialist.name}</h3>
                <p className="text-green-600 font-medium mb-3">{specialist.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{specialist.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}