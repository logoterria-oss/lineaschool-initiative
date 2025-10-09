import { useState } from "react";
import Icon from "@/components/ui/icon";

const faqs = [
  {
    question: "Сколько времени занимает коррекция дислексии и дисграфии?",
    answer: "Длительность коррекции индивидуальна и зависит от степени выраженности нарушений. В среднем она занимает от 6 до 18 месяцев."
  },
  {
    question: "Будут ли домашние задания?",
    answer: "Да, домашние задания — важная часть коррекционной работы. Они помогают закрепить материал и ускорить прогресс ребёнка. Мы разрабатываем простые и увлекательные упражнения, которые займут всего 10-15 минут в день. Родители получают подробные инструкции, поэтому выполнение заданий не вызовет затруднений."
  },
  {
    question: "Как проходят занятия?",
    answer: "Логопедические и нейропсихологические занятия проходят на платформе ZOOM индивидуально и в мини-группах. Урок длится 40 минут, занимаемся 4 раза в неделю — расписание составляется под ваш график. В уроки добавляем игры, чтобы ребёнку было интересно и комфортно."
  },
  {
    question: "Всем ли детям подходит онлайн-формат?",
    answer: "Онлайн-формат подходит большинству детей. Мы успешно работаем с любым темпераментом и находим индивидуальный подход к каждому ребёнку. Однако есть особенности, с которыми мы не работаем дистанционно: серьёзные нарушения слуха и зрения, которые мешают восприятию занятий через экран, а также случаи УО, РАС, ЗРР и ЗПР без сформированной фразовой речи."
  },
  {
    question: "Что нужно для занятий? Нужно ли что-то докупать?",
    answer: "Для занятий нужны пишущие принадлежности и тетрадь (вид линовки уточним после диагностики). Некоторые материалы для домашних заданий необходимо распечатывать, поэтому доступ к принтеру будет огромным плюсом!"
  },
  {
    question: "Сотрудничаете ли с юрлицами?",
    answer: "Да. Подробности можно уточнить в WhatsApp по кнопке \"Задать вопрос\"."
  },
  {
    question: "Сколько стоят занятия?",
    answer: "Стоимость одного урока начинается от 970 рублей и зависит от количества занятий в выбранном абонементе — чем больше уроков вы покупаете, тем выгоднее стоимость каждого."
  },
  {
    question: "Можем ли мы начать заниматься сейчас, а заплатить потом?",
    answer: "Да, такая опция доступна при оплате Долями Плюс."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Часто задаваемые вопросы</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-green-100 bg-white rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                <Icon
                  name={openIndex === index ? "ChevronUp" : "ChevronDown"}
                  size={20}
                  className="text-green-500 flex-shrink-0"
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
