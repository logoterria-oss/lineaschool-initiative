import { useRef } from 'react';
import Icon from '@/components/ui/icon';

const TOC = [
  { id: 'before', label: '1. До занятия' },
  { id: 'plan', label: '2. Идеальный план занятия' },
  { id: 'lesson', label: '3. Проведение занятия' },
  { id: 'dysgraphia', label: '3.1. Коррекция дисграфии', indent: 1 },
  { id: 'speech', label: '3.1.1. Развитие речевых функций', indent: 2 },
  { id: 'pronunciation', label: '3.1.1.1. Коррекция нарушений звукопроизношения', indent: 3 },
  { id: 'phonemic', label: '3.1.1.2. Развитие фонематического восприятия', indent: 3 },
  { id: 'language-analysis', label: '3.1.1.3. Языковой анализ и синтез', indent: 3 },
  { id: 'vocabulary', label: '3.1.1.4. Развитие словаря и грамматического строя речи', indent: 3 },
  { id: 'connected-speech', label: '3.1.1.5. Развитие связной речи', indent: 3 },
  { id: 'visual', label: '3.1.2. Развитие зрительных, зрительно-пространственных и моторных функций', indent: 2 },
  { id: 'dysorthography', label: '3.2. Коррекция дизорфографии', indent: 1 },
  { id: 'dysorth-stages', label: '3.2.1. Этапы работы', indent: 2 },
  { id: 'dysorth-list', label: '3.2.2. Список орфограмм начальной школы', indent: 2 },
  { id: 'dyslexia', label: '3.3. Коррекция дислексии', indent: 1 },
  { id: 'reading-tech', label: '3.3.1. Техника чтения', indent: 2 },
  { id: 'reading-comp', label: '3.3.2. Развитие понимания прочитанного', indent: 2 },
  { id: 'after', label: '4. После занятия' },
  { id: 'alfacrm', label: '4.1. Проведение занятия в AlfaCRM', indent: 1 },
  { id: 'first-lesson', label: '5. Первое занятие с учеником' },
];

const Placeholder = () => (
  <p className="text-gray-400 italic mt-3 text-sm">Раздел будет добавлен...</p>
);

const IndividualRegulation = ({ onBack }: { onBack: () => void }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      {/* Шапка */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
        >
          <Icon name="ArrowLeft" size={20} />
        </button>
        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <Icon name="BookOpen" size={22} className="text-blue-600" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
          Индивидуальные занятия
        </h1>
      </div>

      {/* Оглавление */}
      <div className="bg-white rounded-2xl border border-gray-200 border-t-4 border-t-blue-500 shadow-sm px-5 py-5 mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Оглавление
        </h2>
        <nav className="space-y-0.5">
          {TOC.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="w-full text-left text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg py-1.5 text-[14px] transition-colors"
              style={{ paddingLeft: `${(item.indent ?? 0) * 14 + 12}px` }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Контент */}
      <div
        ref={contentRef}
        className="bg-white rounded-2xl border border-gray-200 border-t-4 border-t-blue-500 shadow-sm px-5 py-6 md:px-8 md:py-8 space-y-10 text-gray-800 leading-relaxed"
      >
        <section id="before">
          <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">1. До занятия</h2>
          <Placeholder />
        </section>

        <section id="plan">
          <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">2. Идеальный план занятия</h2>
          <Placeholder />
        </section>

        <section id="lesson">
          <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">3. Проведение занятия</h2>
          <Placeholder />

          <div id="dysgraphia" className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3.1. Коррекция дисграфии</h3>

            <div id="speech" className="mt-5">
              <h4 className="text-base font-semibold text-gray-800 mb-2">3.1.1. Развитие речевых функций</h4>
              <div id="pronunciation" className="mt-3 ml-4">
                <p className="font-medium text-gray-700 text-sm">3.1.1.1. Коррекция нарушений звукопроизношения</p>
                <Placeholder />
              </div>
              <div id="phonemic" className="mt-3 ml-4">
                <p className="font-medium text-gray-700 text-sm">3.1.1.2. Развитие фонематического восприятия</p>
                <Placeholder />
              </div>
              <div id="language-analysis" className="mt-3 ml-4">
                <p className="font-medium text-gray-700 text-sm">3.1.1.3. Языковой анализ и синтез</p>
                <Placeholder />
              </div>
              <div id="vocabulary" className="mt-3 ml-4">
                <p className="font-medium text-gray-700 text-sm">3.1.1.4. Развитие словаря и грамматического строя речи</p>
                <Placeholder />
              </div>
              <div id="connected-speech" className="mt-3 ml-4">
                <p className="font-medium text-gray-700 text-sm">3.1.1.5. Развитие связной речи</p>
                <Placeholder />
              </div>
            </div>

            <div id="visual" className="mt-5">
              <h4 className="text-base font-semibold text-gray-800 mb-2">3.1.2. Развитие зрительных, зрительно-пространственных и моторных функций</h4>
              <Placeholder />
            </div>
          </div>

          <div id="dysorthography" className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3.2. Коррекция дизорфографии</h3>
            <div id="dysorth-stages" className="mt-3">
              <h4 className="text-base font-semibold text-gray-800 mb-2">3.2.1. Этапы работы</h4>
              <Placeholder />
            </div>
            <div id="dysorth-list" className="mt-5">
              <h4 className="text-base font-semibold text-gray-800 mb-2">3.2.2. Список орфограмм начальной школы</h4>
              <Placeholder />
            </div>
          </div>

          <div id="dyslexia" className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3.3. Коррекция дислексии</h3>
            <div id="reading-tech" className="mt-3">
              <h4 className="text-base font-semibold text-gray-800 mb-2">3.3.1. Техника чтения</h4>
              <Placeholder />
            </div>
            <div id="reading-comp" className="mt-5">
              <h4 className="text-base font-semibold text-gray-800 mb-2">3.3.2. Развитие понимания прочитанного</h4>
              <Placeholder />
            </div>
          </div>
        </section>

        <section id="after">
          <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">4. После занятия</h2>
          <Placeholder />
          <div id="alfacrm" className="mt-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">4.1. Проведение занятия в AlfaCRM</h3>
            <Placeholder />
          </div>
        </section>

        <section id="first-lesson">
          <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">5. Первое занятие с учеником</h2>
          <Placeholder />
        </section>
      </div>
    </div>
  );
};

export default IndividualRegulation;
