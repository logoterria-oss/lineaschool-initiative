import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Icon from "@/components/ui/icon";

export default function Index() {
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

  const services = [
    {
      title: "Углубленная диагностика",
      description: "Комплексное обследование для выявления особенностей развития",
      icon: "Search"
    },
    {
      title: "Индивидуальные планы",
      description: "Персонализированные программы коррекции с учётом потребностей ребёнка",
      icon: "FileText"
    },
    {
      title: "Методические материалы",
      description: "Специально разработанные пособия и упражнения",
      icon: "BookOpen"
    },
    {
      title: "Онлайн сопровождение",
      description: "Дистанционные занятия и консультации для родителей",
      icon: "Video"
    }
  ];

  const faqs = [
    {
      question: "Что такое дислексия и дисграфия?",
      answer: "Дислексия и дисграфия — это специфические нарушения обучения, связанные с трудностями в овладении навыками чтения и письма. Наш подход учитывает нейропсихологические особенности развития и позволяет работать с глубинными механизмами этих расстройств."
    },
    {
      question: "Как проходит процесс диагностики?",
      answer: "Диагностика включает комплексное обследование когнитивных функций, речевого развития и письменной речи. Используются современные нейропсихологические методики для точного определения зон трудностей и составления индивидуального плана коррекции."
    },
    {
      question: "Сколько времени занимает коррекция?",
      answer: "Длительность коррекции индивидуальна и зависит от степени выраженности нарушений. В среднем программа рассчитана на 6-12 месяцев с возможностью продления при необходимости."
    },
    {
      question: "Можно ли заниматься онлайн?",
      answer: "Да, мы предлагаем онлайн-формат занятий с использованием специальных интерактивных материалов и постоянной обратной связью со специалистами."
    }
  ];

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
      name: "Елена Козлова",
      text: "Очень благодарна за комплексный подход. Не только коррекция, но и понимание того, как поддержать ребёнка дома. Рекомендую всем родителям!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Icon name="BookOpen" size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">LineaSchool</span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Button className="bg-green-500 hover:bg-green-600">
                Записаться
              </Button>
              <Button variant="outline" className="border-green-200 text-green-600 hover:bg-green-50">
                Задать вопрос
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Menu Block */}
      <section className="bg-white py-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center w-full">
            <a href="#about" className="text-gray-600 hover:text-green-600 transition-colors font-medium flex-1 text-center">О нас</a>
            <a href="#services" className="text-gray-600 hover:text-green-600 transition-colors font-medium flex-1 text-center">Услуги</a>
            <a href="#specialists" className="text-gray-600 hover:text-green-600 transition-colors font-medium flex-1 text-center">Специалисты</a>
            <a href="#faq" className="text-gray-600 hover:text-green-600 transition-colors font-medium flex-1 text-center">FAQ</a>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 overflow-hidden">
        {/* Age Badge */}
        <div className="absolute top-6 right-6 bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 z-10">
          <span className="text-lg">🎓</span>
          <span className="font-semibold">7-18 лет</span>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight">
              <span className="block text-green-500">Онлайн-коррекция</span>
              дислексии и дисграфии
            </h1>
            <p className="text-xl text-gray-600 mb-4 leading-relaxed">Уникальный комплексный нейрологопедический подход</p>
            
            {/* Stats */}
            <div className="flex justify-center space-x-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">500+</div>
                <div className="text-sm text-gray-600">довольных семей</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">98%</div>
                <div className="text-sm text-gray-600">успешных кейсов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">24/7</div>
                <div className="text-sm text-gray-600">поддержка</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-lg px-8 shadow-lg hover:scale-105 transition-transform animate-pulse hover:animate-bounce">
                <span className="mr-2">📅</span>
                Записаться на БЕСПЛАТНУЮ диагностику
              </Button>
              <Button size="lg" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 text-lg px-8 hover:scale-105 transition-transform">
                <span className="mr-2">▶️</span>
                Смотреть презентацию
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-6">О LineaSchool</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              LineaSchool — это команда преданных своему делу специалистов, которые стремятся оказывать индивидуальную поддержку детям с дислексией и дисграфией. Наш уникальный подход сочетает традиционные логопедические методики с нейропсихологическими методами, обеспечивая комплексную коррекцию.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-green-100 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Target" size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Наша миссия</h3>
                <p className="text-gray-600">
                  Помочь каждому ребёнку раскрыть свой потенциал и преодолеть трудности в обучении с помощью инновационных методов
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-100 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Heart" size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Наши ценности</h3>
                <p className="text-gray-600">
                  Индивидуальный подход, научная обоснованность методов и создание поддерживающей среды для развития
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-100 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Lightbulb" size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Инновации</h3>
                <p className="text-gray-600">
                  Современные нейропсихологические методики в сочетании с проверенными логопедическими практиками
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-6">Наши услуги</h2>
            <p className="text-lg text-gray-600">
              Комплексный подход к коррекции дислексии и дисграфии с использованием современных методик
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="bg-white border-green-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name={service.icon as any} size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">{service.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Specialists Section */}
      <section id="specialists" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-6">Наши специалисты</h2>

          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {specialists.map((specialist, index) => (
              <Card key={index} className="border-green-100 hover:shadow-lg transition-all duration-300 text-center flex flex-col">
                <CardContent className="p-6 flex flex-col flex-grow">
                  <div className="w-40 h-40 mx-auto mb-4 rounded-full overflow-hidden">
                    <img 
                      src={specialist.avatar} 
                      alt={specialist.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col flex-grow">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 h-14 flex items-center justify-center">{specialist.name}</h3>
                    <p className="text-green-600 font-medium mb-3 h-12 flex items-center justify-center">{specialist.role}</p>
                    <p className="text-gray-600 text-sm leading-relaxed flex-grow flex items-start justify-center">{specialist.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-6">Часто задаваемые вопросы</h2>
            <p className="text-lg text-gray-600">
              Ответы на самые популярные вопросы о наших методах и программах
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-green-100">
                <AccordionTrigger className="text-left hover:text-green-600 text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-6">Отзывы родителей</h2>
            <p className="text-lg text-gray-600">
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-500 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Начните путь к успешному обучению уже сегодня
          </h2>
          <p className="text-xl text-green-100 mb-8 leading-relaxed">
            Запишитесь на бесплатную консультацию и узнайте, как мы можем помочь вашему ребёнку
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 text-lg px-8">
              <Icon name="Phone" className="mr-2" size={20} />
              Записаться на консультацию
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600 text-lg px-8">
              <Icon name="Mail" className="mr-2" size={20} />
              Написать нам
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Icon name="BookOpen" size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold text-white">LineaSchool</span>
              </div>
              <p className="text-sm leading-relaxed">
                Инновационная онлайн-школа для коррекции дислексии и дисграфии у школьников
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Услуги</h3>
              <ul className="space-y-2 text-sm">
                <li>Диагностика</li>
                <li>Индивидуальные программы</li>
                <li>Онлайн занятия</li>
                <li>Консультации родителей</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">О нас</h3>
              <ul className="space-y-2 text-sm">
                <li>Наша команда</li>
                <li>Методики</li>
                <li>Результаты</li>
                <li>Отзывы</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Контакты</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Icon name="Mail" size={16} className="mr-2" />
                  info@lineaschool.ru
                </div>
                <div className="flex items-center">
                  <Icon name="Phone" size={16} className="mr-2" />
                  +7 (999) 123-45-67
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 LineaSchool. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}