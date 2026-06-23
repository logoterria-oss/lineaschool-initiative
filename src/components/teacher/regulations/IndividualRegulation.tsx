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
          <div className="mt-4 space-y-3 text-[15px]">
            <p>После подключения педагог проверяет осуществление записи занятия. Если ученик сразу подключается, то начинается работа. Если ученика нет, то ждёт ученика 1–2 минуты, затем пишет в мессенджер школы о том, что ожидает ученика. Педагог ожидает ученика всё время занятия, при этом можно выключить звук и видео. В случае, если ученик подключится, педагог проводит остаток занятия. Если ученик не подключается — необходимо тегнуть администратора <span className="font-mono bg-gray-100 px-1 rounded">@админ</span> в мессенджере.</p>
            <p>Занятие, пропущенное учеником по неуважительной причине, оплачивается педагогу в размере 100% (по текущей ставке).</p>
            <p>В случае невыхода педагога на занятие по неуважительной причине, педагог обязан согласовать с родителями перенос занятия на ближайшую неделю. При этом педагогу будут начислены штрафные баллы в KPI, которые отразятся на размере премиальной части заработной платы.</p>
          </div>
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[15px] text-red-900">
            <p className="font-semibold mb-2">Неуважительные причины для пропуска:</p>
            <ul className="list-disc pl-5 space-y-1 marker:text-red-400">
              <li>невыход ученика/педагога на занятие без предупреждения;</li>
              <li>невыход при предупреждении менее чем за <span className="font-semibold">12 часов</span> (для ученика) и <span className="font-semibold">24 часа</span> (для педагога) до запланированного урока.</li>
            </ul>
            <p className="mt-2 text-red-700 text-[13px]">* Исключения: болезнь со справкой врача, ЧС в регионе или семье, блокировка интернета с подтверждением от провайдера.</p>
          </div>
          <div className="mt-4 flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[15px] text-amber-900">
            <span className="flex-shrink-0 mt-0.5">⚠️</span>
            <p>Материал для занятий педагог подготавливает самостоятельно и заблаговременно. Следите за временем и сложностью выполнения, придерживайтесь структуры занятия! Не показываем лишнего на экране — используем демонстрацию части экрана.</p>
          </div>

          {/* 3.1 Коррекция дисграфии */}
          <div id="dysgraphia" className="mt-10">
            <h3 className="text-lg font-bold text-gray-900 mb-3 pb-1 border-b border-gray-100">3.1. Коррекция дисграфии</h3>
            <p className="text-[15px]">Единой программы для коррекции дисграфии нет. На индивидуальных занятиях педагоги работают над симптоматикой, т.е. над имеющимися ошибками у ученика.</p>
            <p className="text-[15px] mt-2 font-medium">Направления работы логопеда:</p>
            <ol className="mt-2 list-decimal pl-5 space-y-1 text-[15px] marker:text-gray-400">
              <li>Развитие речевых функций: коррекция звукопроизношения, развитие фонематического восприятия, языкового анализа и синтеза, словаря, грамматики, связной речи.</li>
              <li>Развитие зрительных, зрительно-пространственных и моторных функций.</li>
              <li>Развитие регуляторных функций (при согласовании).</li>
            </ol>

            {/* 3.1.1 Речевые функции */}
            <div id="speech" className="mt-7">
              <h4 className="text-base font-semibold text-gray-800 mb-1">Развитие речевых функций</h4>
              <p className="text-[13px] text-gray-500 italic mb-4">Артикуляторно-акустическая, акустическая, на почве нарушения языкового анализа и синтеза, аграмматическая</p>

              {/* 3.1.1.1 */}
              <div id="pronunciation" className="mt-4">
                <h5 className="text-[15px] font-semibold text-gray-800">Коррекция нарушений звукопроизношения</h5>
                <p className="text-[13px] text-gray-500 italic mb-2">при артикуляторно-акустической дисграфии</p>
                <p className="text-[15px] mt-2">Работа со звукопроизношением проводится только если искажения/пропуски/замены звуков в устной речи отображаются на процессе письма.</p>
                <div className="mt-3 space-y-2">
                  <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-[14px]"><span className="font-medium">Пример 1:</span> параротацизм (Р→Л), при письме заменяет Р на Л («молковка») — занимаемся коррекцией параротацизма.</div>
                  <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-[14px]"><span className="font-medium">Пример 2:</span> увулярный ротацизм, при письме заменяет Р на П («мопковка») — коррекцией звукопроизношения не занимаемся.</div>
                  <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-[14px]"><span className="font-medium">Пример 3:</span> набор нарушений, но на письме только пропуск Р («моковка») — работаем только над [Р].</div>
                </div>
                <div className="mt-3 flex gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-[14px] text-green-900">
                  <span className="flex-shrink-0">💡</span>
                  <p>Артикуляторно-акустическая форма дисграфии довольно редкая, поэтому вероятность необходимости такой работы очень невелика.</p>
                </div>
              </div>

              {/* 3.1.1.2 */}
              <div id="phonemic" className="mt-6">
                <h5 className="text-[15px] font-semibold text-gray-800">Развитие фонематического восприятия</h5>
                <p className="text-[13px] text-gray-500 italic mb-2">дифференциация фонем</p>
                <div className="mt-2 flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[14px] text-amber-900">
                  <span className="flex-shrink-0">⚠️</span>
                  <p>Если ошибок очень много и они встречаются в устной речи — можно рекомендовать родителям проверить физический слух ученика.</p>
                </div>
                <p className="text-[15px] mt-3">Направление выделяется в план, если у детей имеются смешения по акустико-артикуляционному сходству:</p>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-[14px] marker:text-gray-400">
                  <li>замены и смешения звонких-глухих согласных</li>
                  <li>ошибки обозначения мягкости («мыр» вместо «мир»)</li>
                  <li>замены и смешения свистящих-шипящих согласных</li>
                  <li>замены и смешения аффрикатов и их компонентов</li>
                  <li>замены и смешения заднеязычных согласных</li>
                  <li>замены и смешения соноров</li>
                  <li>замены и смешения гласных в сильной позиции</li>
                  <li>замены и смешения согласных по способу и месту образования</li>
                </ul>
                <p className="text-[15px] mt-3 font-medium">Этапы работы:</p>
                <div className="mt-2 space-y-3">
                  <div>
                    <p className="text-[14px] font-medium text-gray-700">1) Уточнение признаков каждого из звуков смешиваемой пары:</p>
                    <ul className="mt-1 list-disc pl-5 space-y-1 text-[14px] marker:text-gray-400">
                      <li>использование слоговых таблиц (дифференциация близких звуков);</li>
                      <li>запись под диктовку только слогов с заданным звуком, проверка с подчёркиванием буквы;</li>
                      <li>отбор картинок с заданным звуком в названии;</li>
                      <li>запись слов в два столбика по позиции звука (начало/конец слова);</li>
                      <li>вставка пропущенной буквы, запись в тетрадь;</li>
                      <li>составление схем предложений с обозначением заданного звука;</li>
                      <li>письмо под диктовку с последующей проверкой.</li>
                    </ul>
                    <p className="text-[13px] text-gray-500 italic mt-1">Не используем артикуляционные профили звуков — для младших школьников это бессмысленно.</p>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-gray-700">2) Дифференциация звуков: сначала устно, затем обязательно на письме.</p>
                    <div className="mt-2 bg-gray-50 rounded-lg px-4 py-3 text-[14px]">
                      <p className="font-medium">Пример: дифференциация С-Ш</p>
                      <p className="mt-1"><span className="font-medium">1 этап:</span> уроки «Буква С, звук [С]» и «Буква Ш, звук [Ш]» — ассоциация, артикуляция, характеристика, закрепление. Можно дать родителям задание вклеить ленту букв в тетрадь.</p>
                      <p className="mt-1"><span className="font-medium">2 этап:</span> дифференциация звуков → в слогах → словах → предложениях. Всегда на материале для чтения и письма.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[13px] font-medium text-gray-500 uppercase tracking-wide">Литература</p>
                  <ol className="mt-1 list-decimal pl-5 space-y-0.5 text-[13px] text-gray-600 marker:text-gray-400">
                    <li>Ефименкова Л.Н. Коррекция ошибок, обусловленных несформированностью фонематического восприятия</li>
                    <li>Масютина М., Попова Л. Дисграфия. Звонкие против глухих согласных</li>
                    <li>Мазанова Е.В. Учусь не путать звуки</li>
                    <li>Ефименкова Л.Н. Коррекция устной и письменной речи учащихся начальных классов</li>
                    <li>Садовникова И.Н. Дисграфия, дислексия. Технология преодоления</li>
                    <li>Мазанова Е.В. Коррекция акустической дисграфии</li>
                    <li>Ишимова О.А., Заббарова Е.Х. Различаю звонкие и глухие согласные. Правильно пишу</li>
                  </ol>
                </div>
              </div>

              {/* 3.1.1.3 */}
              <div id="language-analysis" className="mt-6">
                <h5 className="text-[15px] font-semibold text-gray-800">Языковой анализ и синтез</h5>
                <p className="text-[13px] text-gray-500 italic mb-3">Дисграфия на почве нарушений языкового анализа и синтеза (регуляторная дисграфия)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px] border-collapse">
                    <thead>
                      <tr className="bg-blue-50">
                        <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">Направление</th>
                        <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">Возможные темы занятий</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="px-3 py-2 border border-gray-200">Анализ и синтез текста</td><td className="px-3 py-2 border border-gray-200">«Виды речи», «Речь. Предложение», «Заглавная буква», «Виды предложений»</td></tr>
                      <tr className="bg-gray-50"><td className="px-3 py-2 border border-gray-200">Анализ и синтез предложения</td><td className="px-3 py-2 border border-gray-200">«Предложение. Слово», «Раздельное написание слов», «Части речи», «Предлог»</td></tr>
                      <tr><td className="px-3 py-2 border border-gray-200">Слоговой анализ и синтез</td><td className="px-3 py-2 border border-gray-200">«Деление слова на слоги», «Перенос слов»</td></tr>
                      <tr className="bg-gray-50"><td className="px-3 py-2 border border-gray-200">Звуковой анализ и синтез</td><td className="px-3 py-2 border border-gray-200">«Звуки и буквы», «Гласные и согласные», «Ь – показатель мягкости», «Йотированные гласные», «Фонетический разбор»</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[15px] mt-4 font-medium">Этапы работы:</p>
                <div className="mt-3 space-y-4">
                  <div>
                    <p className="text-[14px] font-semibold text-gray-700">1) Анализ текста</p>
                    <p className="text-[14px] mt-1">Цель — научить обозначать границы предложения на письме (заглавная буква и точка). Обязательно обучаем самопроверке: сравниваем количество точек и заглавных букв в образце и в написанном тексте.</p>
                    <p className="text-[13px] font-medium text-gray-500 mt-2">Приёмы:</p>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[13px] marker:text-gray-400">
                      <li>Прочитать/прослушать текст, определить количество предложений</li>
                      <li>Составить схему, списать текст, обвести заглавную букву и точку</li>
                      <li>Дополнить текст ещё одним предложением</li>
                      <li>Составить рассказ по картинке из заданного числа предложений</li>
                      <li>Составить текст из предложений в нарушенном порядке</li>
                      <li>Запомнить текст, пересказать, записать по памяти</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-700">2) Анализ предложения</p>
                    <p className="text-[14px] mt-1">Цель — научить раздельно писать слова в предложении.</p>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[13px] marker:text-gray-400">
                      <li>Прочитать/прослушать предложение, определить количество слов</li>
                      <li>Составить схему предложения, вписать в схему</li>
                      <li>Распространить предложение (устно и письменно)</li>
                      <li>Составить предложение из слов в нарушенном порядке / в начальной форме</li>
                      <li>Анализ предложений с предлогами, с указанием частей речи</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-700">3) Слоговой анализ</p>
                    <p className="text-[14px] mt-1">Цель — научить анализировать и воспроизводить слоговую структуру слова.</p>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[13px] marker:text-gray-400">
                      <li>Определить количество слогов (прошагивание, прохлопывание, цифровой ряд)</li>
                      <li>Разделить слово на слоги, подчеркнуть гласные</li>
                      <li>Разложить картинки в ряды по количеству слогов</li>
                      <li>Составить слово из слогов в беспорядке</li>
                      <li>Разделить слово для переноса</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-700">4) Звуковой анализ</p>
                    <p className="text-[14px] mt-1">Цель — научить анализировать и воспроизводить звуковой состав слова на письме.</p>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[13px] marker:text-gray-400">
                      <li>Определить количество звуков (цифровой ряд, фишки, схемы)</li>
                      <li>Кроссворды, филворды, «Балда», «Виселица»</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <p className="text-[13px] font-semibold text-gray-600 mb-1">Отдельно: твёрдые и мягкие согласные (Ь и йотированные гласные)</p>
                  <p className="text-[13px] text-gray-600 mb-2">Этапность:</p>
                  <ol className="list-decimal pl-5 space-y-0.5 text-[13px] text-gray-700 marker:text-gray-400">
                    <li>Мягкий знак в конце слова (сильная позиция)</li>
                    <li>Мягкий знак в середине слова</li>
                    <li>Йотированные гласные (без мягкого знака)</li>
                    <li>Мягкий знак + йотированные гласные вместе</li>
                    <li>Сложные случаи — ассимилятивная мягкость (песня, грусть, Костя)</li>
                    <li>Разделительный мягкий знак</li>
                  </ol>
                </div>
                <div className="mt-3">
                  <p className="text-[13px] font-medium text-gray-500 uppercase tracking-wide">Литература</p>
                  <ol className="mt-1 list-decimal pl-5 space-y-0.5 text-[13px] text-gray-600 marker:text-gray-400">
                    <li>Ишимова О.А., Юсов И.Е. Понимаю и различаю текст, предложение, слово</li>
                    <li>Воронкова В.В. Русский язык 2 класс</li>
                    <li>Мисаренко Г.Г. Учимся определять части речи</li>
                    <li>Мазанова Е.В. Дисграфия, обусловленная нарушением языкового анализа и синтеза и аграмматическая дисграфия</li>
                    <li>Мазанова Е.В. Коррекция дисграфии на почве нарушения языкового анализа и синтеза</li>
                    <li>Мазанова Е.В. Учусь работать с текстом</li>
                    <li>Ефименкова Л.Н. Коррекция устной и письменной речи учащихся начальных классов</li>
                    <li>Садовникова И.Н. Дисграфия, дислексия. Технология преодоления</li>
                    <li>Масютина М. Твёрдые против мягких согласных</li>
                    <li>Садовникова И.Н. Нарушения письменной речи и их преодоление у младших школьников</li>
                  </ol>
                </div>
              </div>

              {/* 3.1.1.4 */}
              <div id="vocabulary" className="mt-6">
                <h5 className="text-[15px] font-semibold text-gray-800">Развитие словаря и грамматического строя речи</h5>
                <p className="text-[15px] mt-2">Целенаправленный процесс обогащения словарного запаса, освоения морфологии, словообразования и синтаксиса.</p>
                <p className="text-[14px] font-medium mt-3 mb-1">Ключевые направления:</p>
                <ul className="list-disc pl-5 space-y-1 text-[14px] marker:text-gray-400">
                  <li><span className="font-medium">Обогащение словаря:</span> расширение лексикона за счёт абстрактных понятий, синонимов, антонимов, фразеологизмов; включение слов в активный словарь через составление текстов.</li>
                  <li><span className="font-medium">Словообразование:</span> понимание способов образования слов (приставочный, суффиксальный), умение выделять корни и подбирать однокоренные слова.</li>
                  <li><span className="font-medium">Грамматический строй:</span> согласование слов, правильное употребление падежных окончаний и предлогов, понимание сложных грамматических конструкций.</li>
                  <li><span className="font-medium">Синтаксис:</span> построение сложных предложений, использование причастных и деепричастных оборотов, логические связи в тексте.</li>
                </ul>
              </div>

              {/* 3.1.1.5 */}
              <div id="connected-speech" className="mt-6">
                <h5 className="text-[15px] font-semibold text-gray-800">Развитие связной речи</h5>
                <p className="text-[15px] mt-2">Формирование умений логично, последовательно, грамматически и лексически правильно излагать мысли в устной и письменной форме.</p>
                <p className="text-[14px] font-medium mt-3 mb-1">Базовые методы и приёмы:</p>
                <ul className="list-disc pl-5 space-y-1 text-[14px] marker:text-gray-400">
                  <li>Составление рассказов: описание картинки, пересказ текста, придумывание продолжения по опорным словам.</li>
                  <li>Работа с деформированным текстом: восстановление порядка предложений, вставка пропущенных связующих слов.</li>
                </ul>
              </div>
            </div>

            {/* 3.1.2 Зрительные функции */}
            <div id="visual" className="mt-8">
              <h4 className="text-base font-semibold text-gray-800 mb-1">Развитие зрительных, зрительно-пространственных и моторных функций</h4>
              <p className="text-[13px] text-gray-500 italic mb-3">Оптико-моторная, оптическая дисграфия</p>
              <p className="text-[14px] font-medium mb-2">Симптомы зрительно-пространственной дисграфии:</p>
              <ul className="list-disc pl-5 space-y-1 text-[14px] marker:text-gray-400">
                <li>Трудности ориентировки на листе (левостороннее игнорирование)</li>
                <li>Трудности удержания строки</li>
                <li>Замена на зрительно похожие буквы, замена рукописных букв печатными, необычный способ написания</li>
                <li>Устойчивая зеркальность при написании букв и цифр</li>
                <li>Колебания наклона, ширины и высоты букв</li>
                <li>Раздельное написание букв внутри слова</li>
                <li>Слитное написание двух и более слов</li>
                <li>Нарушение порядка букв в словах</li>
                <li>Пропуск и замена гласных (в том числе ударных)</li>
                <li>Тенденция к фонетическому письму</li>
                <li>Трудности овладения словарными словами</li>
              </ul>

              <div className="mt-5">
                <p className="text-[14px] font-semibold text-gray-700">Зеркальные ошибки</p>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-[14px] marker:text-gray-400">
                  <li>Ребёнок «поворачивает» букву вокруг вертикальной (реже горизонтальной) оси</li>
                  <li>Меняет порядок букв при чтении/письме (справа налево)</li>
                  <li>Меняет направление чтения/письма</li>
                </ul>
                <p className="text-[14px] mt-3">При коррекции формируем правильный двигательный (моторный) стереотип: учим руку писать буквы многократным повторением пальцем, фломастером, ручкой. Можно использовать буквенные раскраски, игру «Угадай букву».</p>
                <div className="mt-3 flex gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[14px] text-red-900">
                  <span className="flex-shrink-0">🚫</span>
                  <p>При коррекции зеркальных ошибок <span className="font-semibold">запрещается</span> давать ученику образы неправильно написанных букв! Исключение — найти ошибки в своей работе.</p>
                </div>
                <p className="text-[14px] mt-3">Двигательный стереотип не работает при зеркально парных буквах («b» и «d», «З» и «Е») — в этих случаях используем внешний алгоритм.</p>
                <p className="text-[14px] font-medium mt-4 mb-2">Преодоление ошибок с помощью внешнего алгоритма:</p>
                <ol className="list-decimal pl-5 space-y-1.5 text-[14px] marker:text-gray-400">
                  <li>Маркировать левую руку браслетиком, обозначить на листах буквы «Л» и «П»</li>
                  <li>Наблюдать за буквами: находить симметричные, смотрящие влево и вправо</li>
                  <li>Заучивание букв, которые «смотрят» влево (их меньше)</li>
                  <li>Опорные карточки с «сомнительными» буквами</li>
                  <li>Корректурные пробы (обвести все буквы, смотрящие влево)</li>
                  <li>Найти лишнюю среди нескольких похожих букв</li>
                  <li>Конструирование букв из разных материалов</li>
                  <li>Графический диктант с буквенным кодированием направлений</li>
                  <li>Мнемоприёмы для курсивного письма (У — «улитка», Ч — «панцирь черепахи»)</li>
                  <li>Мнемофразы («Зина Умнее Чем Элла и Яша» — буквы, смотрящие налево)</li>
                </ol>
              </div>

              <div className="mt-5">
                <p className="text-[14px] font-semibold text-gray-700">Этапы формирования пространственных представлений:</p>
                <ol className="mt-2 list-decimal pl-5 space-y-1 text-[14px] marker:text-gray-400">
                  <li>«Схема тела» — повторение поз за педагогом с пересечением средней линии и без</li>
                  <li>«Внешнее пространство» — пространство комнаты</li>
                  <li>«Пространство листа» — графические диктанты</li>
                  <li>«Квазипространственные» представления — логико-грамматические конструкции, месяцы, времена года, часы</li>
                </ol>
                <p className="text-[13px] text-gray-500 italic mt-2">Начинаем с того уровня, на котором начинаются сложности. Если путает лево-право — начинаем с «внешнего пространства».</p>
              </div>

              <div className="mt-5">
                <p className="text-[14px] font-semibold text-gray-700">Ориентация в пространстве тетрадного листа нужна для:</p>
                <ul className="mt-2 list-disc pl-5 space-y-0.5 text-[14px] marker:text-gray-400">
                  <li>нахождения стартовой точки слева (преодоление левостороннего игнорирования)</li>
                  <li>удержания строки, вписывания символов в строку/клетку</li>
                  <li>следования правилам оформления работы</li>
                  <li>понимания принципа таблицы умножения, действий в столбик, геометрии</li>
                </ul>
                <p className="text-[14px] mt-3">Если ученик не находит стартовую точку — маркируем левый верхний угол буквой «Л». Для удержания строки маркируем её цветом или используем метод «кривых строк».</p>
              </div>

              <div className="mt-5">
                <p className="text-[14px] font-semibold text-gray-700 mb-2">Графические диктанты (от простого к сложному):</p>
                <ul className="list-disc pl-5 space-y-0.5 text-[14px] marker:text-gray-400">
                  <li>Продолжение узора по образцу; выполнение по зрительной программе</li>
                  <li>Копирование изображения; выполнение с оречевлением направления; под диктовку</li>
                  <li>«Зеркальные» диктанты; перешифровка; изменение масштаба</li>
                  <li>Самостоятельное построение зрительно-пространственной программы</li>
                </ul>
              </div>

              <div className="mt-5">
                <p className="text-[14px] font-semibold text-gray-700 mb-2">Раздельное/слитное написание слов:</p>
                <ul className="list-disc pl-5 space-y-0.5 text-[14px] marker:text-gray-400">
                  <li>Нахождение слов среди ряда букв</li>
                  <li>Разделение «слипшихся» слов</li>
                  <li>Филворды, кроссворды</li>
                  <li>Письмо в клетку (1 буква = 1 клетка, пробел = 1 клетка)</li>
                  <li>Письмо по пространственной программе под диктовку</li>
                </ul>
              </div>

              <div className="mt-5">
                <p className="text-[14px] font-semibold text-gray-700 mb-2">Работа с гласными:</p>
                <ul className="list-disc pl-5 space-y-0.5 text-[14px] marker:text-gray-400">
                  <li>4-й лишний с гласными</li>
                  <li>Вставка гласных в слова</li>
                  <li>Классификация по столбцам с заданными гласными</li>
                  <li>Чтение с маркированием гласных</li>
                  <li>Маркирование и обводка гласных в слове, предложении, тексте</li>
                  <li>Избирательное письмо: только гласные</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3.2 Коррекция дизорфографии */}
          <div id="dysorthography" className="mt-10">
            <h3 className="text-lg font-bold text-gray-900 mb-3 pb-1 border-b border-gray-100">3.2. Коррекция дизорфографии</h3>
            <div id="dysorth-stages" className="mt-3">
              <h4 className="text-base font-semibold text-gray-800 mb-3">3.2.1. Этапы работы</h4>
              <ol className="list-decimal pl-5 space-y-1 text-[15px] marker:text-gray-400">
                <li>Обучение обнаружению орфограммы (орфографическая зоркость)</li>
                <li>Обучение определению типа орфограммы и актуализация правила</li>
                <li>Обучение привлечению лексического и грамматического материала по условиям правила</li>
              </ol>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-[13px] font-semibold text-gray-600 mb-1">Трудности при дизорфографии:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[13px] text-gray-700 marker:text-gray-400">
                    <li>регуляторные трудности</li>
                    <li>проблемы со звуковым анализом</li>
                    <li>маленький словарный запас</li>
                    <li>плохие грамматические навыки</li>
                    <li>проблемы с запоминанием</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-[13px] font-semibold text-gray-600 mb-1">Виды правил:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[13px] text-gray-700 marker:text-gray-400">
                    <li><span className="font-medium">Правила-алгоритмы</span> — есть последовательность действий</li>
                    <li><span className="font-medium">Правила-предписания</span> — исторический принцип (жи-ши, чк-чн, словарные слова)</li>
                  </ul>
                </div>
              </div>
              <p className="text-[14px] mt-4 text-gray-600">Рекомендуется начинать с наиболее простых орфограмм, в которых у ученика наблюдаются ошибки.</p>
              <div className="mt-4">
                <p className="text-[14px] font-semibold text-gray-800">Первое правило-алгоритм: «Безударная гласная в корне слова»</p>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-[13px] font-medium text-gray-600">1) Развитие орфографической зоркости:</p>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[13px] marker:text-gray-400">
                      <li>найти слова, которые произносятся иначе, чем пишутся</li>
                      <li>орфографическое чтение</li>
                      <li>найти слова-омофоны (луг–лук, лиса–леса)</li>
                      <li>фонетический разбор (осознание нетождественности звука и буквы)</li>
                      <li>письмо «с окошком» (не знаю букву — пропускаю)</li>
                      <li>упражнения на нахождение и обозначение безударных гласных</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-600">2) Определение места орфограммы:</p>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[13px] marker:text-gray-400">
                      <li>подбор родственных слов / форм слов</li>
                      <li>поиск слов с ударными и неударными гласными в корне</li>
                      <li>определение проверочного и проверяемого слова</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-600">3) Способы подбора родственных слов:</p>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[13px] marker:text-gray-400">
                      <li>Большой–маленький: трава–травка</li>
                      <li>Поменять часть речи: больной–боль</li>
                      <li>Присоединить приставку (глаголы)</li>
                      <li>Работа с самыми продуктивными корнями</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-600">4) Поиск проверочного слова:</p>
                    <p className="text-[13px] mt-1 text-gray-700">Слова, в которых ударение падает на гласную корня — проверочные. Важно давать визуальную опору! Работа с омофонами.</p>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-600">5) Запись и проверка (формируемые умения):</p>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[13px] marker:text-gray-400">
                      <li>Умею определять звуковой состав слова</li>
                      <li>Знаю, что буквы и звуки не совпадают</li>
                      <li>Умею ставить ударение</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-600">6) Упреждающий контроль → запись → проверка:</p>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[13px] marker:text-gray-400">
                      <li>Не писать, не обсудив!</li>
                      <li>Принцип первых упражнений: сначала проверочное, потом проверяемое</li>
                      <li>Перед написанием — коротко сформулировать решение (кОрмить, потому что кОрм)</li>
                      <li>Следовой контроль: цель (что будешь писать) → результат (есть ли это)</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[13px] font-medium text-gray-500 uppercase tracking-wide">Литература</p>
                <ol className="mt-1 list-decimal pl-5 space-y-0.5 text-[13px] text-gray-600 marker:text-gray-400">
                  <li>Рамзаева Т.Г., Львов М.Р. Методика преподавания русского языка</li>
                  <li>Мисаренко Г.Г. Методика обучения младших школьников русскому с коррекционно-развивающими технологиями</li>
                  <li>Прищепова И.В. Дизорфография младших школьников</li>
                  <li>Елецкая О.В. Методика коррекции дизорфографии у школьников</li>
                  <li>Азова О.И. Логопедия. Дизорфография</li>
                  <li>Мисаренко Г.Г. Русский язык. Закрепляем трудные темы. 3 класс</li>
                  <li>Китикова А.В. Рабочая тетрадь по коррекции дизорфографии у младших школьников</li>
                </ol>
              </div>
            </div>

            <div id="dysorth-list" className="mt-7">
              <h4 className="text-base font-semibold text-gray-800 mb-3">3.2.2. Список орфограмм начальной школы</h4>
              <div className="space-y-4">
                {[
                  { grade: '1 класс', items: ['Заглавная буква в начале предложения', 'Правописание безударных гласных', 'Слова с удвоенными согласными', 'Правописание слов с мягким знаком', 'Правописание парных глухих и звонких согласных', 'Буквосочетания чк, чн, чт', 'Буквосочетания жи-ши, ча-ща, чу-щу', 'Заглавная буква в именах собственных'] },
                  { grade: '2 класс', items: ['Заглавная буква в именах собственных', 'Правописание безударных гласных', 'Слова с удвоенными согласными', 'Правописание слов с мягким знаком', 'Буквосочетания чк, чн, чт, щн, нч', 'Буквосочетания жи-ши, ча-ща, чу-щу', 'Правописание парных глухих и звонких согласных', 'Разделительный мягкий знак', 'Не с глаголами', 'Правописание предлогов со словами'] },
                  { grade: '3 класс', items: ['Безударные гласные', 'Парные глухие и звонкие согласные', 'Правописание слов с непроизносимым согласным', 'Правописание слов с двойными согласными', 'Правописание суффиксов и приставок', 'Разделительный твёрдый знак', 'Соединительные гласные о и е в сложных словах', 'Мягкий знак после шипящих на конце имён существительных', 'Не с глаголами'] },
                  { grade: '4 класс', items: ['Правописание слов с буквами ь и ъ', 'Безударные падежные окончания имён существительных', 'Безударные падежные окончания имён прилагательных', 'Мягкий знак после шипящих на конце глаголов 2-го лица ед.ч.', 'Мягкий знак в глаголах на -ться, -тся', 'Безударные личные окончания глаголов', 'Правописание местоимений', 'Непроверяемые гласные и согласные'] },
                ].map(({ grade, items }) => (
                  <div key={grade} className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="font-semibold text-[14px] text-blue-700 mb-2">{grade}</p>
                    <ol className="list-decimal pl-5 space-y-0.5 text-[13px] text-gray-700 marker:text-gray-400">
                      {items.map((item) => <li key={item}>{item}</li>)}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3.3 Коррекция дислексии */}
          <div id="dyslexia" className="mt-10">
            <h3 className="text-lg font-bold text-gray-900 mb-3 pb-1 border-b border-gray-100">3.3. Коррекция дислексии</h3>
            <p className="text-[15px]">Основные направления:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-[15px] marker:text-gray-400">
              <li>Развитие техники чтения (скорость и корректность): слоги, слова, предложения, тексты</li>
              <li>Развитие понимания прочитанного: единичных слов, предложений, текстов</li>
            </ul>
            <div className="mt-3">
              <p className="text-[13px] font-medium text-gray-500 uppercase tracking-wide">Пособия</p>
              <ol className="mt-1 list-decimal pl-5 space-y-0.5 text-[13px] text-gray-600 marker:text-gray-400">
                <li>Корсунская Б.Д. Читаю сам</li>
                <li>Мальцева И. Я читаю и понимаю слова</li>
                <li>Ишимова О.А., Сабельникова С.И. Чтение. Читаю и понимаю</li>
                <li>Зегебарт Г., Масютина М., Попова Л. Прочтение. Мир вокруг</li>
                <li>Резниченко Т.С., Дмитрова Е.Д. Учимся читать правильно</li>
                <li>Мисаренко Г.Г. Дидактический материал для развития техники чтения в начальной школе</li>
                <li>Павлова Н. Читаем после азбуки</li>
                <li>Технологии современного обучения. Учимся читать. Читаем тексты</li>
              </ol>
            </div>

            <div id="reading-tech" className="mt-6">
              <h4 className="text-base font-semibold text-gray-800 mb-3">3.3.1. Техника чтения</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-[14px] font-semibold text-gray-700">Техника чтения на начальном этапе:</p>
                  <ol className="mt-2 list-decimal pl-5 space-y-1.5 text-[14px] marker:text-gray-400">
                    <li>
                      <span className="font-medium">Укрупнение оперативных единиц чтения:</span> от слогов к словам
                      <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[13px] marker:text-gray-400">
                        <li>автоматизация слогослияния, слоговые цепочки</li>
                        <li>слоговой синтез, составление слов из слогов</li>
                        <li>переход к предложениям: задания по типу «Снежный ком»</li>
                      </ul>
                      <div className="mt-1 flex gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[13px] text-amber-800">
                        <span>⚠️</span>
                        <p>Не автоматизируем слоги, редко используемые в русской речи (например, КЮ). На одном занятии — сразу читаем слоги и слова с ними.</p>
                      </div>
                    </li>
                    <li><span className="font-medium">Отработка сложных моментов русской графики</span></li>
                    <li><span className="font-medium">Прослеживание строки</span></li>
                    <li><span className="font-medium">Слоговой синтез</span></li>
                    <li><span className="font-medium">Лексический доступ</span></li>
                  </ol>
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-gray-700">Развитие скорости чтения — ступени:</p>
                  <ol className="mt-2 list-decimal pl-5 space-y-0.5 text-[13px] marker:text-gray-400">
                    <li>Узнаёт букву, соотносит со звуком</li>
                    <li>Читает сразу слог, готов к анализу постпозиции (МА–МЯ)</li>
                    <li>Не теряет строку, следит слева направо</li>
                    <li>Легко осуществляет слоговой синтез</li>
                    <li>Быстро находит близкое слово — лексический доступ</li>
                  </ol>
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-gray-700">Развитие корректности чтения — коррекция угадывания:</p>
                  <ul className="mt-2 list-disc pl-5 space-y-0.5 text-[13px] marker:text-gray-400">
                    <li>Цепочки слов с одной изменяемой буквой: липа, лупа, лапа</li>
                    <li>Поиск заданного слова из близких по написанию</li>
                    <li>Словесные лабиринты</li>
                    <li>Поиск несуществующего слова среди похожих</li>
                    <li>«Химеры» — слияние двух слов (бегемот + крокодил = «бегедил»)</li>
                    <li>Поиск правильно написанного слова среди вариантов</li>
                    <li>«Найди общий слог» в цепочке слов</li>
                  </ul>
                </div>
              </div>
            </div>

            <div id="reading-comp" className="mt-6">
              <h4 className="text-base font-semibold text-gray-800 mb-3">3.3.2. Развитие понимания прочитанного</h4>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-[14px] mb-3">
                <p className="font-medium text-gray-700 mb-1">Причины сложностей:</p>
                <ol className="list-decimal pl-5 space-y-0.5 text-gray-600 marker:text-gray-400">
                  <li>Не хватает объёма оперативной памяти для удержания всех слогов и синтеза слова</li>
                  <li>Слово фонетическое ≠ слово орфографическое</li>
                  <li>Нет готовности к извлечению смысла</li>
                </ol>
              </div>
              <p className="text-[14px] font-medium text-gray-700 mb-2">Приёмы работы:</p>
              <ol className="list-decimal pl-5 space-y-1.5 text-[14px] marker:text-gray-400">
                <li>Слоговой синтез: составить слово из слогов; выбрать недостающий слог (с опорной картинкой)</li>
                <li>Подбор материала с картинками (особенно если орфографическое слово отличается от фонетического: солнце → «сонце»)</li>
                <li>Картинка + варианты слов — выбрать подходящее; трансформации слов; лексическая связь (часть–целое, синонимы, антонимы). Чаще спрашиваем: «А что это такое?»</li>
                <li>При переходе к предложениям: работа с рифмами, нелепицами, многозначностью слов</li>
              </ol>
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