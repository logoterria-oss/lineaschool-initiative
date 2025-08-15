import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Icon from "@/components/ui/icon";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

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

  const pricingPlans = [
    {
      title: "1 месяц",
      subtitle: "Базовый тариф",
      totalLessons: 16,
      pricePerLesson: "1 380 ₽",
      totalPrice: "22 080 ₽",
      lessons: [
        "4 индивидуальных занятия с логопедом",
        "4 индивидуальных занятия с нейропсихологом", 
        "8 групповых занятий"
      ],
      features: [
        "Первичная диагностика",
        "Индивидуальный план занятий",
        "Методические материалы",
        "Поддержка в чате"
      ]
    },
    {
      title: "3 месяца",
      subtitle: "Оптимальный выбор",
      totalLessons: 54,
      pricePerLesson: "1 170 ₽",
      totalPrice: "63 180 ₽",
      lessons: [
        "12 индивидуальных занятий с логопедом",
        "12 индивидуальных занятий с нейропсихологом",
        "24 групповых занятия"
      ],
      features: [
        "Углубленная диагностика",
        "Персональный куратор",
        "Промежуточные отчеты",
        "Консультации для родителей"
      ],
      popular: true,
      discount: "Экономия 15%"
    },
    {
      title: "6 месяцев",
      subtitle: "Максимальный результат",
      totalLessons: 96,
      pricePerLesson: "970 ₽",
      totalPrice: "93 120 ₽",
      lessons: [
        "24 индивидуальных занятия с логопедом",
        "24 индивидуальных занятия с нейропсихологом",
        "48 групповых занятий"
      ],
      features: [
        "Комплексная диагностика",
        "Персональный куратор",
        "Ежемесячные отчеты",
        "Гарантия результата"
      ],
      discount: "Экономия 30%"
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
      name: "Елена Васильева",
      text: "Очень довольны результатами! Ребёнок стал увереннее в себе, улучшилась успеваемость в школе. Спасибо за терпение и профессионализм!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Icon name="BookOpen" size={24} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-green-600">LineaSchool</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-gray-600 hover:text-green-600 font-medium">О нас</a>
              <a href="#services" className="text-gray-600 hover:text-green-600 font-medium">Услуги</a>
              <a href="#pricing" className="text-gray-600 hover:text-green-600 font-medium">Стоимость</a>
              <a href="#specialists" className="text-gray-600 hover:text-green-600 font-medium">Специалисты</a>
              <a href="#faq" className="text-gray-600 hover:text-green-600 font-medium">FAQ</a>
              <Button className="bg-green-500 hover:bg-green-600">Записаться</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">500+</div>
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
                    beforeImage: "https://cdn.poehali.dev/files/01e04738-94b7-4b8f-b05c-efd09c13e969.jpg",
                    afterImage: "https://cdn.poehali.dev/files/725de2f7-1ddd-4b52-b0a9-30cf01c3264b.jpg",
                    beforeAlt: "Письменная работа до коррекции",
                    afterAlt: "Письменная работа после коррекции"
                  },
                  {
                    beforeImage: "/img/917769e5-2165-4f97-9a90-fd900bd6a378.jpg",
                    afterImage: "/img/ae24f599-1121-4e72-a712-76ffc59a0f18.jpg",
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

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Почему выбирают нас?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Мы используем передовые методики и индивидуальный подход к каждому ребёнку
            </p>
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

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Стоимость занятий</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Выберите удобный тариф для вашего ребёнка
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative p-8 ${plan.popular ? 'border-2 border-green-500 bg-white shadow-xl scale-105' : 'border-green-100 bg-white'} hover:shadow-lg transition-all duration-300`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Популярный
                    </span>
                  </div>
                )}
                {plan.discount && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-semibold">
                      {plan.discount}
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.title}</h3>
                  <p className="text-green-600 font-medium mb-6">{plan.subtitle}</p>
                  
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {plan.pricePerLesson}
                      <span className="text-lg font-normal text-gray-600">/урок</span>
                    </div>
                    <div className="text-gray-600">
                      Всего: <span className="font-semibold">{plan.totalPrice}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {plan.totalLessons} занятий
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Состав курса:</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {plan.lessons.map((lesson, lIndex) => (
                        <li key={lIndex} className="flex items-center text-left">
                          <Icon name="Clock" size={14} className="text-green-500 mr-2 flex-shrink-0" />
                          <span>{lesson}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <ul className="space-y-3 mb-8 text-left">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center">
                        <Icon name="Check" size={16} className="text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white border-2 border-green-500 text-green-600 hover:bg-green-50'}`}
                    size="lg"
                  >
                    Выбрать тариф
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Не знаете, какой тариф выбрать? Запишитесь на бесплатную консультацию
            </p>
            <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
              <Icon name="MessageCircle" className="mr-2" size={20} />
              Получить консультацию
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Наши услуги</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Комплексный подход к коррекции дислексии и дисграфии
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="bg-white border-green-100 hover:shadow-lg transition-all duration-300 hover:scale-105 p-6 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name={service.icon as any} size={24} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{service.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">О LineaSchool</h2>
              <div className="space-y-4 text-lg text-gray-700">
                <p>
                  LineaSchool — это команда преданных своему делу специалистов, которые стремятся оказывать индивидуальную поддержку детям с дислексией и дисграфией.
                </p>
                <p>
                  Наш уникальный подход сочетает в себе традиционные логопедические и современные нейропсихологические методики, обеспечивая комплексную коррекцию нарушений процессов чтения и письма.
                </p>
                <p>
                  Мы понимаем, что каждый ребёнок уникален, поэтому разрабатываем персональные программы коррекции, учитывающие индивидуальные особенности и потребности.
                </p>
              </div>
              
              <div className="mt-8 flex space-x-4">
                <Button size="lg" className="bg-green-500 hover:bg-green-600">
                  Узнать больше
                </Button>
                <Button size="lg" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                  Наши методы
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="/img/48f49395-68a6-46e4-99d8-fc5d9338a979.jpg" 
                alt="Преподаватель с детьми"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Specialists Section */}
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

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Часто задаваемые вопросы</h2>
            <p className="text-xl text-gray-600">
              Ответы на самые популярные вопросы о наших методах и программах
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-green-100 bg-white mb-4 rounded-lg px-6">
                <AccordionTrigger className="text-left hover:text-green-600 text-lg font-semibold">
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-500 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
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
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Icon name="BookOpen" size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold text-white">LineaSchool</span>
              </div>
              <p className="text-gray-400 mb-4">
                Профессиональная коррекция дислексии и дисграфии для детей 7-18 лет
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-green-500">
                  <Icon name="Mail" size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-green-500">
                  <Icon name="Phone" size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Услуги</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-green-500">Диагностика</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-500">Индивидуальные занятия</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-500">Групповые занятия</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-500">Консультации</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">О школе</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-green-500">Наши методы</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-500">Специалисты</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-500">Отзывы</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-500">Блог</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Контакты</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">info@linea-school.ru</li>
                <li className="text-gray-400">+7 (495) 123-45-67</li>
                <li className="text-gray-400">Онлайн-школа</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">© 2024 LineaSchool. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}