import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';

const TOC = [
  { id: 'before', label: '1. До занятия' },
  { id: 'plan', label: '2. Идеальный план занятия' },
  { id: 'lesson', label: '3. Проведение занятия' },
  { id: 'block1', label: '3.1. Упражнения на развитие 1 блока мозга', indent: 1 },
  { id: 'commissural', label: '3.2. Упражнения на развитие комиссуральных связей', indent: 1 },
  { id: 'selfregulation', label: '3.3. Работа над саморегуляцией', indent: 1 },
  { id: 'planning', label: '3.4. Развитие навыка планирования', indent: 1 },
  { id: 'successive', label: '3.5. Развитие сукцессивных процессов', indent: 1 },
  { id: 'control', label: '3.6. Развитие навыка контроля', indent: 1 },
  { id: 'memory', label: '3.7. Развитие рабочей памяти и произвольного внимания', indent: 1 },
  { id: 'after', label: '4. После занятия' },
  { id: 'alfacrm', label: '4.1. Проведение занятия в AlfaCRM', indent: 1 },
];

const GroupRegulation = ({ onBack }: { onBack: () => void }) => {
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
        <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
          <Icon name="BookOpen" size={22} className="text-purple-600" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
          Групповые занятия
        </h1>
      </div>

      {/* Оглавление */}
      <div className="bg-white rounded-2xl border border-gray-200 border-t-4 border-t-purple-500 shadow-sm mb-6 overflow-hidden">
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
                className="w-full text-left text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg py-1.5 text-[14px] transition-colors"
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
        className="bg-white rounded-2xl border border-gray-200 border-t-4 border-t-purple-500 shadow-sm px-5 py-6 md:px-8 md:py-8 space-y-10 text-gray-800 leading-relaxed"
      >
        {/* Вводный блок */}
        <section>
          <p className="text-[15px]">Данный тип занятий проходит в мини-группах до 6 человек. Уроки длятся по 40 минут (непосредственно работа с учениками). Обратная связь родителям, домашние задания (вместе с объяснением их правильного выполнения), проверка домашних заданий осуществляются через мессенджер школы «ЛинэяСкул-мессенджер».</p>
          <p className="text-[15px] mt-3">Методические материалы в формате презентаций подготавливает руководитель учебного отдела (РУО) Ирина Зинченко и загружает в папку «ГРУППОВЫЕ»:{' '}
            <a href="https://disk.yandex.ru/d/vSrnod871psW3Q" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline underline-offset-2 hover:text-purple-900 break-all">disk.yandex.ru/d/vSrnod871psW3Q</a>{' '}
            два раза в неделю: в воскресенье — на группы ПН-СР, в среду — на группы ЧТ-ВС. Вопросы по методике также направляются РУО.
          </p>
          <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-[15px] text-purple-900">
            <span className="font-semibold">Цель групповых занятий</span> — развитие регуляторных функций у детей с нарушениями процессов чтения и письма. Эту цель мы достигаем не столько через выполнение упражнений, сколько через качественно организованную и дисциплинированную работу в форме взаимодействия «ученик–ученик» и «ученик–педагог». Регуляторные функции формируются и развиваются только в структурированной деятельности с чёткими правилами под внешним контролем.
          </div>
        </section>

        {/* 1. До занятия */}
        <section id="before">
          <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">1. До занятия</h2>
          <ul className="mt-4 space-y-2 list-disc pl-5 text-[15px] marker:text-gray-400">
            <li>Утром, до 10:00 по Мск отправляем ссылки на уроки ученикам, у которых в этот день групповые занятия (с приветствием и указанием времени).</li>
            <li>На ЯндексДиск открываем папку с файлами для групповых.</li>
            <li>Знакомимся с материалами (если возникают вопросы — пишем Ирине Зинченко).</li>
            <li>При необходимости адаптируем задания под возраст и ЗУН'ы учеников группы: подумайте, как каждое задание можно адаптировать под каждого ученика.</li>
            <li>
              Проверяем наличие выполненной домашней работы:
              <ol className="mt-2 space-y-1 list-decimal pl-5 marker:text-gray-400">
                <li>Перед предстоящим уроком проверяем ДЗ и пишем ученику обратную связь (если ДЗ нет — напоминаем, что нужно выполнить).</li>
                <li>После проверки заходим в «Контроль ДЗ» под своё имя на сайте{' '}
                  <a href="https://lineaschool.ru/admin/teacher" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline decoration-purple-300 underline-offset-2 hover:text-purple-900">lineaschool.ru/admin/teacher</a>{' '}
                  (пароль 426874) и на дату урока, НА КОТОРОМ ДАЛИ ДЗ, ставим цвет: <span className="text-green-700 font-medium">зелёный</span> — выполнено хорошо, <span className="text-yellow-600 font-medium">жёлтый</span> — выполнено плохо или не полностью, <span className="text-red-600 font-medium">красный</span> — не выполнено.
                </li>
                <li>Если ДЗ ученик отправил, но не вовремя — также жёлтый.</li>
              </ol>
            </li>
          </ul>
        </section>

        {/* 2. Идеальный план */}
        <section id="plan">
          <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">2. Идеальный план занятия</h2>
          <ul className="mt-4 space-y-2 text-[15px]">
            <li className="flex gap-3"><span className="font-semibold text-purple-700 w-20 flex-shrink-0">1–2 мин</span><span>Приветствие + рассылка опаздывающим</span></li>
            <li className="flex gap-3"><span className="font-semibold text-purple-700 w-20 flex-shrink-0">3–4 мин</span><span>Упражнения на активизацию 1 блока мозга (ствол, подкорка, ретикулярная формация) и развитие комиссуральных связей (мозолистое тело — межполушарное взаимодействие)</span></li>
            <li className="flex gap-3">
              <span className="font-semibold text-purple-700 w-20 flex-shrink-0">32–35 мин</span>
              <span>Основная часть — развитие функций 3 блока мозга:
                <ul className="mt-1 list-disc pl-4 space-y-0.5 marker:text-gray-400">
                  <li>развитие саморегуляции</li>
                  <li>развитие навыка планирования (программирования)</li>
                  <li>развитие навыка контроля</li>
                  <li>развитие сукцессивных процессов</li>
                  <li>развитие рабочей памяти</li>
                  <li>развитие произвольного внимания</li>
                  <li className="text-gray-500">+ разминка (опционально, если дети не могут сконцентрировать внимание)</li>
                </ul>
              </span>
            </li>
            <li className="flex gap-3"><span className="font-semibold text-purple-700 w-20 flex-shrink-0">2 мин</span><span>Рефлексия, прощание</span></li>
          </ul>
          <div className="mt-4 flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[15px] text-amber-900">
            <span className="flex-shrink-0">⚠️</span>
            <div className="space-y-2">
              <p>Занятия по развитию регуляторных навыков — это не просто поиграть и забыть. Педагог обязан качественно работать по всем направлениям и адаптировать задания под каждого участника группы!</p>
              <p>Помним про зону ближайшего развития: если не получается даже со стимулирующей помощью — облегчаем; если успешно справляется в 80–90% случаев в течение 2–3 занятий — усложняем.</p>
              <p className="font-semibold">Вам не нужно «отработать» все слайды — вам нужно отработать все направления коррекции регуляторных функций!</p>
              <p>На одно задание из основной части должно уходить не более 8–10 минут.</p>
            </div>
          </div>
        </section>

        {/* 3. Проведение занятия */}
        <section id="lesson">
          <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">3. Проведение занятия</h2>

          {/* 3.1 Блок 1 мозга */}
          <div id="block1" className="mt-8">
            <h3 className="text-base font-bold text-gray-900 text-center mb-3">Упражнения на развитие 1 блока мозга</h3>
            <p className="text-[15px]">1 (энергетический) блок мозга обеспечивает энергией всю кору больших полушарий, включая 3 (регуляторный) блок. Без активизации 1 блока в начале урока регуляторному блоку не хватит энергии на полноценную работу в течение 40 минут.</p>
            <p className="text-[15px] mt-3 font-medium">В начале занятия активизируем 1 блок мозга через:</p>
            <ol className="mt-2 list-decimal pl-5 space-y-1 text-[15px] marker:text-gray-400">
              <li>Крупные активные движения различными частями тела (лучше стоя)</li>
              <li>Дыхательную гимнастику</li>
            </ol>
            <div className="mt-4 flex gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-[14px] text-blue-900">
              <span className="flex-shrink-0">💡</span>
              <p>Если в середине урока дети «выключаются» из работы — добавляем ещё один блок упражнений. Если не помогает, просим родителей ставить перед ребёнком стакан воды и делаем серию форсированных выдохов.</p>
            </div>
            <p className="text-[15px] mt-4">Чтобы работать не только над эксплицитными (осознаваемыми), но и имплицитными (неосознаваемыми) паттернами, при работе над 1 блоком мозга <span className="font-semibold">не даём инструкций</span>:</p>
            <ul className="mt-2 space-y-2 list-disc pl-5 text-[14px] marker:text-gray-400">
              <li>Педагог начинает делать ритмичное упражнение без инструкции, со счётом — дети подключаются; педагог прекращает показ, но продолжает считать; затем убирает счёт — дети делают сами. Хвалим только тех, чей ритм не сбился.</li>
              <li>Педагог начинает дыхательную гимнастику без пояснений — дети повторяют по слайду; педагог убирает слайд и дышит 1–2 серии вместе с детьми; затем дети сами. Нейтральное подбадривание: «Кого ждём?»</li>
            </ul>
          </div>

          {/* 3.2 Комиссуральные связи */}
          <div id="commissural" className="mt-10">
            <h3 className="text-base font-bold text-gray-900 text-center mb-3">Упражнения на развитие комиссуральных связей</h3>
            <p className="text-[15px]">Активизируют мозолистое тело, через которое осуществляется взаимосвязь правого и левого полушарий. При слабости межполушарных связей мозг тратит слишком много энергии на торможение «мешающих» сигналов, и ребёнок быстро истощается.</p>
            <div className="mt-3 flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[14px] text-amber-900">
              <span className="flex-shrink-0">⚠️</span>
              <p>Не любая нейрогимнастика подходит! Нужна нейрогимнастика на <span className="font-semibold">билатеральную координацию</span>: одновременно двумя руками выполняются асимметричные или разнонаправленные упражнения.</p>
            </div>
            <ul className="mt-3 space-y-1 text-[14px] list-disc pl-5 marker:text-gray-400">
              <li>Если не получается одновременно — максимально снижаем скорость; если не получается даже медленно — сначала отдельно для каждой стороны.</li>
              <li>Если слишком просто — увеличиваем скорость до сверхзвуковой 🙂</li>
            </ul>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-[13px]">
                <p className="font-semibold text-gray-700 mb-1">Крупная моторика — асимметрия</p>
                <p>Одна рука ладошкой хлопает по макушке, другая — по кругу гладит живот (сначала по часовой, потом против). Затем меняем руки.</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-[13px]">
                <p className="font-semibold text-gray-700 mb-1">Крупная моторика — разнонаправленно</p>
                <p>Левое плечо вращаем вперёд, правое — назад. Затем меняем направление для каждого плеча.</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-[13px]">
                <p className="font-semibold text-gray-700 mb-1">Мелкая моторика — асимметрия</p>
                <p>Одна рука показывает «козу», другая — «зайца». Одновременно меняем.</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-[13px]">
                <p className="font-semibold text-gray-700 mb-1">Мелкая моторика — разнонаправленно</p>
                <p>Большой палец левой руки касается подушечек от мизинца до указательного, правой — от указательного до мизинца. Затем меняем руки.</p>
              </div>
            </div>
            <p className="text-[13px] text-gray-500 italic mt-3">Если упражнения не слишком сложные — по аналогии с предыдущим блоком можно предлагать без устной инструкции.</p>
          </div>

          {/* 3.3 Саморегуляция */}
          <div id="selfregulation" className="mt-10">
            <h3 className="text-base font-bold text-gray-900 text-center mb-3">Работа над саморегуляцией</h3>
            <p className="text-[15px]">Направлена на подавление неуместных импульсов ребёнка как при письме/чтении, так и в поведении в целом. На групповых занятиях проводится не через стандартизованные упражнения, а через <span className="font-semibold">правильную организацию детей в группе</span>.</p>
            <div className="mt-4 space-y-5">
              <div>
                <p className="text-[14px] font-semibold text-gray-800">1) Очерёдность ответов</p>
                <p className="text-[14px] mt-1">В начале основной части педагог задаёт последовательность (напр., Маша → Саша → Лёша → Гриша → Ваня). Ученики запоминают её и на всех заданиях без командных ответов отвечают строго в этой последовательности.</p>
                <div className="mt-2 flex gap-2.5 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-[13px] text-purple-900">
                  <span className="flex-shrink-0">💡</span>
                  <p>Очерёдность побочно развивает рабочую память, контроль, сукцессивный анализ, произвольное внимание и планирование. <span className="font-semibold">60–80% заданий</span> должны выполняться именно так.</p>
                </div>
                <p className="text-[13px] font-medium text-gray-600 mt-3">Усложнения:</p>
                <ul className="mt-1 list-disc pl-5 space-y-1 text-[13px] marker:text-gray-400">
                  <li>Добавить «стоп-блоки» между ответами (хлопок, кодовое слово и т.д.)</li>
                  <li>«Снежный ком»: каждый следующий ученик повторяет предыдущие ответы, затем добавляет свой. Объём рабочей памяти в норме — 7±2 элемента!</li>
                </ul>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-800">2) «Кто быстрее?» с торможением импульса</p>
                <p className="text-[14px] mt-1">Кто нашёл ответ — поднимает руку. Учитель раздаёт баллы по порядку поднятия рук. Кто выкрикнул ответ — получает 0 баллов.</p>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-800">3) Коллективное выполнение</p>
                <p className="text-[14px] mt-1">Когда все ученики подняли руку — одновременно без подсказки учителя дают ответ хором. Педагог следит за точностью выполнения инструкции.</p>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-800">4) Задания на переключение</p>
                <p className="text-[14px] mt-1">Короткий вопрос — короткий ответ без паузы «на подумать». При переключении меняется правило или модальность ответа (громко/шёпотом, устно/обводкой на экране). Инструкцию и отвечающего называем <span className="font-semibold">после</span> вопроса.</p>
              </div>
            </div>
          </div>

          {/* 3.4 Планирование */}
          <div id="planning" className="mt-10">
            <h3 className="text-base font-bold text-gray-900 text-center mb-3">Развитие навыка планирования (программирования)</h3>
            <p className="text-[15px]">Работаем через <span className="font-semibold">алгоритмизацию</span>. Алгоритм — это порядок действий, приводящий к результату. Задания подобного типа обязательны на каждом занятии. Рекомендуемая длина: 3–6 блоков действия.</p>
            <div className="mt-4 bg-gray-50 rounded-xl px-4 py-4 text-[14px]">
              <p className="font-semibold text-gray-700 mb-3">Блоки алгоритма:</p>
              <ul className="space-y-2 text-gray-700">
                <li><span className="font-medium">Название</span> — пишем над цепочкой блоков, без фигуры. Должно отсылать к планируемому результату.</li>
                <li><span className="font-medium">Овалы</span> — «начало» и «конец» (открывашки и закрывашки алгоритма).</li>
                <li><span className="font-medium">Прямоугольники</span> — блоки действий. Формы глаголов должны быть одинаковыми и соотноситься с результатом.</li>
                <li><span className="font-medium">Параллелограмм</span> — блок «вывод»: результат алгоритма полным предложением.</li>
              </ul>
            </div>
            <p className="text-[14px] font-medium mt-4 mb-2">Составлять алгоритмы можно:</p>
            <ol className="list-decimal pl-5 space-y-1 text-[14px] marker:text-gray-400">
              <li>По серии сюжетных картинок</li>
              <li>По заданному тексту</li>
              <li>По заданной теме</li>
            </ol>

            {/* Пример 1 — картинки + алгоритм */}
            <div className="mt-5">
              <p className="text-[13px] font-medium text-gray-500 mb-2">Пример 1: алгоритм по серии сюжетных картинок</p>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <figure className="w-full sm:w-1/2">
                  <p className="text-[13px] font-medium text-gray-600 italic mb-1 text-center">Алгоритм «Как обидеть кота?»</p>
                  <img
                    src="https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/326607b5-cdc5-45ba-9d08-e0f120093429.png"
                    alt="Алгоритм «Как обидеть кота?»"
                    className="w-full rounded-lg border border-gray-200 shadow-sm"
                  />
                </figure>
              </div>
            </div>

            {/* Пример 2 — рассказ + алгоритм */}
            <div className="mt-5">
              <p className="text-[13px] font-medium text-gray-500 mb-2">Пример 2: алгоритм по рассказу</p>
              <img
                src="https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/94185afd-7ab7-4925-b6a7-5fc526daa0ce.png"
                alt="Рассказ «Сапожки для кошки»"
                className="w-full rounded-lg border border-gray-200 shadow-sm"
              />
              <figure className="mt-3">
                <p className="text-[13px] font-medium text-gray-600 italic mb-1 text-center">Алгоритм «Почему животные подарили обувь Насте?»</p>
                <img
                  src="https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/da97b328-2809-41d2-9873-b1aa4d10be62.png"
                  alt="Алгоритм «Почему животные подарили обувь Насте?»"
                  className="w-full max-w-[160px] mx-auto block rounded-lg border border-gray-200 shadow-sm"
                />
              </figure>
            </div>

            {/* Пример 3 — по заданной теме */}
            <div className="mt-5">
              <p className="text-[13px] font-medium text-gray-500 mb-1">Пример 3: алгоритм по заданной теме</p>
              <p className="text-[13px] text-gray-600 mb-2">Тема, предложенная учителем: «Сборы в школу»</p>
              <figure>
                <p className="text-[13px] font-medium text-gray-600 italic mb-1 text-center">Алгоритм «Как собраться утром в школу?»</p>
                <img
                  src="https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/de0f9a9b-05a5-4ec8-90ff-6a77026c6591.png"
                  alt="Алгоритм «Как собраться утром в школу?»"
                  className="w-full max-w-[160px] mx-auto block rounded-lg border border-gray-200 shadow-sm"
                />
              </figure>
            </div>
            <div className="mt-4 flex gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-[14px] text-blue-900">
              <span className="flex-shrink-0">💡</span>
              <p>Добавьте временной компонент: просите оценить, сколько времени займёт каждый шаг — это тренирует сукцессивные процессы и чувство времени.</p>
            </div>
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-900">
              <p className="font-semibold mb-1">На что обратить внимание:</p>
              <ul className="list-disc pl-4 space-y-0.5 marker:text-amber-500">
                <li>Следим за адекватностью сложности возрасту и уровню группы</li>
                <li>Если «застряли» — доделайте вместе или задайте на ДЗ (с проверкой)</li>
                <li>Перед каждым алгоритмом проговариваем с детьми, что такое алгоритм и какие блоки за что отвечают</li>
              </ul>
            </div>
          </div>

          {/* 3.5 Сукцессивные процессы */}
          <div id="successive" className="mt-10">
            <h3 className="text-base font-bold text-gray-900 text-center mb-3">Развитие сукцессивных процессов</h3>
            <p className="text-[15px]">Целенаправленно включаем блок по развитию <span className="font-semibold">сукцессивного анализа</span> (выделить отдельные элементы последовательности) и <span className="font-semibold">сукцессивного синтеза</span> (объединить элементы во временно-пространственную последовательность) — через шифровки.</p>
            <div className="mt-4 space-y-3">
              {[
                { name: 'Шифр Цезаря', desc: 'Каждая буква сдвигается по алфавиту на заданное число. При смещении +3: А→Г, Б→Д и т.д. Дойдя до конца алфавита, отсчёт начинается заново.' },
                { name: 'Шифр с заменой буквы на символ', desc: 'Каждая буква всегда заменяется на один и тот же символ. Например: А=★, Б=#, В=@.' },
                { name: 'Цифровой шифр', desc: 'Буквы заменяются их порядковыми номерами в алфавите (А=1, Я=33). Числа пишем через запятую.' },
                { name: 'Азбука Морзе', desc: 'Кодирование букв и цифр с помощью коротких (точек) и длинных (тире) сигналов. Пишем через запятую.' },
                { name: 'Масонский шифр', desc: 'Геометрический шифр замены: буквы алфавита заменяются на фрагменты сетки с точками.', link: 'https://disk.yandex.ru/i/sbDsRLu5StFMOA', linkText: 'Видео по шифровке' },
                { name: 'Квадрат Полибия', desc: 'Алфавит записывается в квадрат 6×6. Строки и столбцы пронумерованы. Буква кодируется двумя цифрами: номер строки и номер столбца.' },
              ].map(({ name, desc, link, linkText }) => (
                <div key={name} className="bg-gray-50 rounded-xl px-4 py-3 text-[14px]">
                  <p className="font-semibold text-gray-800 mb-1">{name}</p>
                  <p className="text-gray-700">{desc}</p>
                  {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-purple-600 underline underline-offset-2 hover:text-purple-900 text-[13px] mt-1 block">{linkText}</a>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[13px] text-gray-500 italic mt-3">Для старших групп можно использовать комбинации шифров.</p>
          </div>

          {/* 3.6 Контроль */}
          <div id="control" className="mt-10">
            <h3 className="text-base font-bold text-gray-900 text-center mb-3">Развитие навыка контроля</h3>
            <p className="text-[15px]">Развиваем при проверке текстов или записи текста по инструкции. Ученик выступает в роли <span className="font-semibold">редактора</span>, который находит чужие ошибки или допускает их по заданию — это снижает тревожность и тренирует контроль без угрозы собственной неуспешности.</p>
            <p className="text-[14px] font-medium mt-4 mb-2">Примеры заданий:</p>
            <ol className="list-decimal pl-5 space-y-1.5 text-[14px] marker:text-gray-400">
              <li>Исправить все ошибки в тексте: переписать / выделить в презентации / озвучить</li>
              <li>Исправить только определённый тип ошибок (напр., вставить пропущенные буквы, сохраняя лишние)</li>
              <li>Написать текст с ошибками по инструкции (напр., после каждой третьей буквы вставить Н)</li>
              <li>Заменить буквы на символы (напр., А → ♥, каждая пятая буква → +)</li>
              <li>Переписать деформированный текст правильно (написан задом-наперёд или зеркально)</li>
              <li>Превратить обычный текст в деформированный по инструкции (следим за адекватностью сложности)</li>
            </ol>
            <div className="mt-3 flex gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-[14px] text-blue-900">
              <span className="flex-shrink-0">💡</span>
              <p>Задания на поиск ошибок работают и на планирование. Усиливаем эффект: просим сначала мысленно восстановить верный образ, и только потом вносить правки.</p>
            </div>
          </div>

          {/* 3.7 Рабочая память и внимание */}
          <div id="memory" className="mt-10">
            <h3 className="text-base font-bold text-gray-900 text-center mb-3">Развитие рабочей памяти и произвольного внимания</h3>
            <p className="text-[15px]">При корректной работе по всем направлениям выше рабочая память и произвольное внимание развиваются побочно на всех этапах работы. Если на занятии вы успели качественно отработать все вышеописанные направления и у вас осталось время — подключаем следующие задания.</p>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-[14px] font-semibold text-gray-800 mb-2">Задания на произвольное внимание:</p>
                <ol className="list-decimal pl-5 space-y-0.5 text-[14px] marker:text-gray-400">
                  <li>Поиск предметов на картинке</li>
                  <li>Корректурные пробы</li>
                  <li>Таблицы Шульте</li>
                  <li>Поиск отличий</li>
                </ol>
              </div>

              <div>
                <p className="text-[14px] font-semibold text-gray-800 mb-2">Задания на рабочую память (зрительную):</p>
                <ol className="list-decimal pl-5 space-y-2 text-[14px] marker:text-gray-400">
                  <li>«Что пропало?»</li>
                  <li>«Запомни ряд»</li>
                  <li>«Где была фигура?» — показать сетку 3×3 или крупнее с одной или несколькими фигурами на несколько секунд и убрать; дети либо указывают координаты фигур («второй столбик, первая строчка»), либо воспроизводят сетку в тетради.</li>
                </ol>
              </div>

              <div>
                <p className="text-[14px] font-semibold text-gray-800 mb-2">Задания на рабочую память (слуховую):</p>
                <ol className="list-decimal pl-5 space-y-2 text-[14px] marker:text-gray-400">
                  <li>«Цифры наоборот» — педагог называет ряд цифр или слов, дети повторяют в обратном порядке.</li>
                  <li>«Многоступенчатая инструкция» — например: «Встань, подними правую руку, скажи СТОП, сядь». Дети выполняют по памяти.</li>
                  <li>«Две дорожки» — педагог называет два коротких ряда цифр или слов; дети воспроизводят первый ряд в прямом порядке, а второй — в обратном, или чередуя по одному элементу из каждого ряда.</li>
                  <li>«Обратный порядок + действие» — ряд цифр (3-7-2) → дети называют в обратном порядке, прибавляя 1 к каждой цифре (3-8-4).</li>
                </ol>
              </div>
            </div>
            <p className="text-[13px] text-gray-500 italic mt-4 text-center">Помним: рабочая память школьника в норме удерживает 7±2 элемента!</p>
          </div>
        </section>

        {/* 4. После занятия */}
        <section id="after">
          <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">4. После занятия</h2>
          <ol className="mt-4 list-decimal pl-5 space-y-3 text-[15px] marker:text-gray-400">
            <li>
              Видео с занятия загружаем на ЯндексДиск, в папку «Записи уроков»:{' '}
              <a href="https://disk.yandex.ru/d/1QUhtcEtVOSRBg" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline underline-offset-2 hover:text-purple-900 break-all">disk.yandex.ru/d/1QUhtcEtVOSRBg</a>
            </li>
            <li>
              Отправляем обратную связь родителю в мессенджер.
              <div className="mt-2 flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[14px] text-amber-900">
                <span className="flex-shrink-0">⚠️</span>
                <p>Обратная связь должна содержать не только план занятия с целями, но и несколько слов об успехах или сложностях <span className="font-semibold">конкретного ученика</span>.</p>
              </div>
            </li>
            <li>Отправляем ссылку на PDF с домашним заданием каждому ученику — в том числе тем, кого не было по неуважительной причине. ДЗ должно соответствовать направлениям работы на групповых занятиях и быть адаптировано под ЗУН'ы каждого ребёнка.</li>
            <li>Проводим занятие в AlfaCRM.</li>
          </ol>

          <div id="alfacrm" className="mt-8">
            <h3 className="text-base font-bold text-gray-900 text-center mb-4 mt-2">Проведение занятия в AlfaCRM</h3>
            <div className="space-y-6">
              <div>
                <p className="text-[15px] font-medium mb-3">1. Заходим на вкладку «Уроки»</p>
                <img
                  src="https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/44f0a3eb-c14f-4709-bb03-f6147e97680e.png"
                  alt="Вкладка Уроки в AlfaCRM"
                  className="w-full max-w-md mx-auto rounded-lg border border-gray-200 shadow-sm block"
                />
              </div>
              <div>
                <p className="text-[15px] font-medium mb-3">2. Нажимаем на проведённый урок, проверяем список учеников. Если ученик отсутствовал — убираем «галочку», выставляем причину отсутствия.</p>
                <div className="flex flex-col sm:flex-row gap-3 items-start justify-center">
                  <img
                    src="https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/68709c92-bbc9-427c-a425-34012542034e.png"
                    alt="Карточка урока"
                    className="w-full sm:w-1/2 rounded-lg border border-gray-200 shadow-sm"
                  />
                  <img
                    src="https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/56c488f5-09f8-4dec-b624-5443ce01c426.png"
                    alt="Причина отсутствия"
                    className="w-full sm:w-1/2 rounded-lg border border-gray-200 shadow-sm"
                  />
                </div>
              </div>
              <div>
                <p className="text-[15px] font-medium">3. В теме пишем фактический план занятия.</p>
              </div>
              <div>
                <p className="text-[15px] font-medium">4. В комментарии можем указать успехи/сложности учеников и <span className="font-bold">ОБЯЗАТЕЛЬНО</span> ссылку на видео проведённого урока.</p>
                <a href="https://disk.yandex.ru/i/wg7NmV3B2qsLRw" target="_blank" rel="noopener noreferrer" className="text-[14px] mt-2 text-purple-700 underline underline-offset-2 hover:text-purple-900 block">Обучающее видео «Как скопировать ссылку на видео»</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default GroupRegulation;