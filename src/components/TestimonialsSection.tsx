import { Card, CardContent } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

const testimonials = [
  {
    name: "Мария Петрова",
    text: "Благодаря LineaSchool мой сын Артём значительно улучшил навыки чтения и письма. Индивидуальный подход и профессионализм команды превзошли все ожидания.",
    rating: 5
  },
  {
    name: "Алексей Смирнов",
    text: "Виктория Абраменко и её команда помогли нашей дочери справиться с дисграфией. Методы действительно работают, видим результат каждую неделю.",
    rating: 5
  },
  {
    name: "Елена Васильева",
    text: "Очень довольны результатами! Ребёнок стал увереннее в себе, улучшилась успеваемость в школе. Спасибо за терпение и профессионализм!",
    rating: 5
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Отзывы родителей</h2>
          <p className="text-xl text-gray-600">
            Истории успеха наших учеников и благодарности от их семей
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-green-100 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Icon key={i} name="Star" size={20} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">"{testimonial.text}"</p>
                <div className="font-semibold text-gray-800">{testimonial.name}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}