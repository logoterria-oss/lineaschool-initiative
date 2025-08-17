import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

export default function FAQSection() {
  return (
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
  );
}