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
      description: "Комплексное обследование для выявления механизма нарушения",
      icon: "Search"
    },
    {
      title: "Индивидуальные занятия",
      description: "Персональная работа с логопедом и нейропсихологом по узконаправленным задачам",
      icon: "FileText"
    },
    {
      title: "Групповые занятия",
      description: "Занятия в малых группах для коррекции регуляторных трудностей и взаимного обучения",
      icon: "BookOpen"
    },
    {
      title: "Консультации для родителей",
      description: "Обучение родителей методам поддержки ребёнка дома",
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
      answer: "Диагностика включает комплексное обследование когнитивных функций, речевого развития и письменной речи. Она проходит в два этапа: на первичной диагностике специалист выявляет наличие/отсутствие специфических нарушений процессов чтения и письма, на углубленной - определяет форму и механизм нарушения. После этого составляется подробное логопедическое заключение и индивидуальный план коррекции."
    },
    {
      question: "Сколько времени занимает коррекция?",
      answer: "Длительность коррекции индивидуальна и зависит от степени выраженности нарушений. В среднем она занимает от 6 до 18 месяцев."
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-fun rounded-xl flex items-center justify-center animate-pulse-grow">
                <Icon name="BookOpen" size={28} className="text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-800">LineaSchool</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce-fun">
                Записаться
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 text-lg px-8 py-3 hover:scale-105 transition-all duration-300">
                Задать вопрос
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Menu Block */}
      <section className="bg-white/50 py-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center w-full">
            <a href="#about" className="text-gray-600 hover:text-primary transition-colors font-medium flex-1 text-center hover:scale-110 transform duration-300">О нас</a>
            <a href="#services" className="text-gray-600 hover:text-primary transition-colors font-medium flex-1 text-center hover:scale-110 transform duration-300">Услуги</a>
            <a href="#specialists" className="text-gray-600 hover:text-primary transition-colors font-medium flex-1 text-center hover:scale-110 transform duration-300">Специалисты</a>
            <a href="#faq" className="text-gray-600 hover:text-primary transition-colors font-medium flex-1 text-center hover:scale-110 transform duration-300">FAQ</a>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 overflow-hidden">
        {/* Age Badge */}
        <div className="absolute top-6 right-6 bg-gradient-fun text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 z-10 animate-bounce-fun">
          <span className="text-lg">🎓</span>
          <span className="font-semibold">7-18 лет</span>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-800 mb-8 leading-tight">
              <span className="block text-transparent bg-gradient-to-r from-primary to-secondary bg-clip-text animate-shimmer">Онлайн-коррекция</span>
              дислексии и дисграфии
            </h1>
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">Уникальный комплексный нейрологопедический подход</p>
            
            {/* Stats */}
            <div className="flex justify-center space-x-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-base text-gray-600">довольных семей</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">98%</div>
                <div className="text-base text-gray-600">успешных кейсов</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">24/7</div>
                <div className="text-base text-gray-600">поддержка</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="animate-shimmer text-xl px-10 py-4 shadow-lg hover:scale-105 transition-all duration-300 hover:animate-bounce text-white">
                <span className="mr-2">📅</span>
                Записаться на БЕСПЛАТНУЮ диагностику
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 text-xl px-10 py-4 hover:scale-105 transition-transform hover:shadow-lg">
                <span className="mr-2">▶️</span>
                Смотреть презентацию
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">О LineaSchool</h2>
            <p className="text-lg text-gray-600 leading-relaxed">LineaSchool — это команда преданных своему делу специалистов, которые стремятся оказывать индивидуальную поддержку детям с дислексией и дисграфией. Наш уникальный подход сочетает в себе традиционные логопедические и современные нейропсихологические методики, обеспечивая комплексную коррекцию нарушений процессов чтения и письма.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {specialists.map((specialist, index) => (
              <Card key={index} className="border-primary/20 hover:shadow-2xl transition-all duration-300 text-center flex flex-col hover:scale-105 hover:border-primary/40 bg-gradient-to-br from-white to-primary/5">
                <CardContent className="p-6 flex flex-col flex-grow">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-primary/20 hover:ring-primary/40 transition-all duration-300">
                    <img 
                      src={specialist.avatar} 
                      alt={specialist.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col flex-grow">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{specialist.name}</h3>
                    <p className="text-secondary font-medium mb-3">{specialist.role}</p>
                    <p className="text-gray-600 text-sm leading-relaxed flex-grow">{specialist.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-6">Наши услуги</h2>
            <p className="text-lg text-gray-600">
              Комплексный подход к коррекции дислексии и дисграфии с использованием современных методик
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-secondary/20 hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:border-secondary/40 animate-pulse-grow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-gradient-fun rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-fun">
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



      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-6">Часто задаваемые вопросы</h2>
            <p className="text-lg text-gray-600">
              Ответы на самые популярные вопросы о наших методах и программах
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-primary/20 hover:border-primary/40 bg-white/50 rounded-lg mb-4 px-4">
                <AccordionTrigger className="text-left hover:text-primary text-lg font-semibold">
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
      <section className="py-20 bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-6">Отзывы родителей</h2>
            <p className="text-lg text-gray-600">
              Истории успеха наших учеников и благодарности от их семей
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-primary/20 hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm hover:border-primary/40">
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
      <section className="py-20 bg-gradient-fun">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Начните путь к успешному обучению уже сегодня
          </h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Запишитесь на бесплатную консультацию и узнайте, как мы можем помочь вашему ребёнку
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 hover:scale-105 transition-all duration-300 shadow-lg">
              <Icon name="Phone" className="mr-2" size={20} />
              Записаться на консультацию
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary text-lg px-8 hover:scale-105 transition-all duration-300">
              <Icon name="Mail" className="mr-2" size={20} />
              Написать нам
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-800 via-gray-900 to-purple-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-fun rounded-lg flex items-center justify-center animate-pulse-grow">
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