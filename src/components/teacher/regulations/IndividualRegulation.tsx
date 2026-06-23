import { useRef, useState } from 'react';
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
  const [tocOpen, setTocOpen] = useState(false);

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
      <div className="bg-white rounded-2xl border border-gray-200 border-t-4 border-t-blue-500 shadow-sm mb-6 overflow-hidden">
        <button
          onClick={() => setTocOpen(!tocOpen)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Оглавление</span>
          <Icon name={tocOpen ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-gray-400" />
        </button>
        {tocOpen && (
          <nav className="space-y-0.5 px-5 pb-4">
            {TOC.map((item) => (
              <button
                key={item.id}
                onClick={() => { scrollTo(item.id); setTocOpen(false); }}
                className="w-full text-left text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg py-1.5 text-[14px] transition-colors"
                style={{ paddingLeft: `${(item.indent ?? 0) * 14 + 12}px` }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Контент */}
      <div
        ref={contentRef}
        className="bg-white rounded-2xl border border-gray-200 border-t-4 border-t-blue-500 shadow-sm px-5 py-6 md:px-8 md:py-8 space-y-10 text-gray-800 leading-relaxed"
      >
        {/* Вводный блок */}
        <section>
          <p className="text-[15px]">Уроки длятся по 40 минут (непосредственно работа с учениками). Обратная связь родителям, домашние задания (вместе с объяснением их правильного выполнения), проверка домашних заданий осуществляются через мессенджер школы «ЛинэяСкул-мессенджер».</p>
          <p className="text-[15px] mt-2"><span className="font-semibold">Цель индивидуальных занятий:</span> коррекция дислексии, дисграфии и дизорфографии при выполнении устных и письменных заданий.</p>
        </section>

        <section id="before">
          <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">1. До занятия</h2>
          <ul className="mt-4 space-y-2 list-disc pl-5 text-[15px] marker:text-gray-400">
            <li>Утром, до 10:00 по Мск отправляем ссылку на урок в мессенджер ученику, у которого в этот день индивидуальное занятие (с приветствием и указанием времени запланированного урока).</li>
            <li>Анализируем предыдущие успехи и сложности у ученика.</li>
            <li>Планируем занятие, подбираем подходящий материал. Материал должен быть качественным, тексты хорошо читаемыми, в идеале содержать интерактивное задание, например, созданные на платформе Wordwall.</li>
            <li>
              Проверяем наличие выполненной домашней работы:
              <ol className="mt-2 space-y-1 list-decimal pl-5 marker:text-gray-400">
                <li>Перед предстоящим уроком проверяем ДЗ и пишем ученику обратную связь (если ДЗ нет — напоминаем, что нужно выполнить).</li>
                <li>После проверки заходим в «Контроль ДЗ» под своё имя на сайте{' '}
                  <a href="https://lineaschool.ru/admin/teacher" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800">lineaschool.ru/admin/teacher</a>{' '}
                  (пароль 426874) и на дату урока, НА КОТОРОМ ДАЛИ ДЗ, ставим цвет: <span className="text-green-700 font-medium">зелёный</span> — выполнено хорошо, <span className="text-yellow-600 font-medium">жёлтый</span> — выполнено плохо или не полностью, <span className="text-red-600 font-medium">красный</span> — не выполнено.
                </li>
                <li>Если ДЗ ученик отправил, но не вовремя — также жёлтый.</li>
              </ol>
            </li>
          </ul>
          <div className="mt-4 flex gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-[15px] text-blue-900">
            <span className="flex-shrink-0 mt-0.5">ℹ️</span>
            <p>Если педагог у ученика является замещающим, ему также необходимо ознакомиться с предыдущими работами ученика, понять, на каком этапе находится коррекция, грамотно выстроить работу. Эту информацию можно запросить у основного педагога.</p>
          </div>
        </section>

        <section id="plan">
          <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">2. Идеальный план занятия</h2>
          <ul className="mt-4 space-y-2 text-[15px]">
            <li className="flex gap-3"><span className="font-semibold text-blue-700 w-20 flex-shrink-0">1–2 мин</span><span>Приветствие</span></li>
            <li className="flex gap-3"><span className="font-semibold text-blue-700 w-20 flex-shrink-0">3–4 мин</span><span>Упражнения на активизацию 1 блока мозга: активные движения / дыхательные упражнения / самомассаж, упражнения для развития межполушарного взаимодействия</span></li>
            <li className="flex gap-3"><span className="font-semibold text-blue-700 w-20 flex-shrink-0">32–35 мин</span>
              <span>Основная часть урока. Могут быть задания:
                <ul className="mt-1 list-disc pl-4 space-y-0.5 marker:text-gray-400">
                  <li>коррекция дисграфии в соответствии с видом дисграфии</li>
                  <li>коррекция дизорфографии</li>
                  <li>коррекция дислексии</li>
                </ul>
              </span>
            </li>
            <li className="flex gap-3"><span className="font-semibold text-blue-700 w-20 flex-shrink-0">2 мин</span><span>Рефлексия, прощание</span></li>
          </ul>
          <div className="mt-4 space-y-2 text-[15px] text-gray-700">
            <p>На индивидуальных занятиях придерживаемся этапности коррекции, учитываем зону ближайшего развития, учитываем информацию из диагностических срезов. При коррекции дисграфии и дизорфографии необходимы письменные задания.</p>
            <p>На индивидуальные занятия <span className="font-semibold">не берём</span> задания на внимание, рабочую память, сукцессивные процессы: навыки регуляции и контроля у абсолютного большинства детей развивают на групповых занятиях (исключительные случаи согласовываем). Также не включаем в урок нецелевые задания, не направленные на коррекцию выявленной формы дисграфии / дислексии / дизорфографии.</p>
          </div>
          <div className="mt-4 flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[15px] text-amber-900">
            <span className="flex-shrink-0 mt-0.5">⚠️</span>
            <p>Если вы не согласны с заключением, обязательно свяжитесь с Ириной Зинченко и аргументированно объясните свою позицию. В таком случае после согласования направления коррекционной работы у данного ученика могут быть изменены.</p>
          </div>
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