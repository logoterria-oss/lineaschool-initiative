const GroupRegulationLesson = () => (
  <>
        {/* 3. Проведение занятия */}
        <section id="lesson">
          <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">3. Проведение занятия</h2>

          <div className="mt-4 space-y-3 text-[15px]">
            <p>После подключения педагог проверяет осуществление записи занятия.{' '}
              <a href="https://disk.yandex.ru/i/p_HNikxyQ8fYQA" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline underline-offset-2 hover:text-purple-900">Как настроить автоматическую запись в Zoom?</a>{' '}
              Запускаем учеников в конференцию, и начинается работа. Если ученика (одного или нескольких) нет — педагог ждёт 1–2 минуты, затем пишет в мессенджер школы о том, что ожидает ученика. Если никто из учеников не подключился, педагог ожидает всё время занятия (можно выключить звук и видео — такая ситуация бывает редко, проверьте мессенджер). Если ученик не подключается — тегните администратора <span className="font-mono bg-gray-100 px-1 rounded">@админ</span> в мессенджере.
            </p>
            <p>В случае пропуска/отмены педагогом занятия по неуважительной причине ему будут начислены штрафные баллы в KPI, которые отразятся на размере премиальной части заработной платы.</p>
          </div>
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[15px] text-red-900">
            <p className="font-semibold mb-2">Неуважительные причины для пропуска:</p>
            <ul className="list-disc pl-5 space-y-1 marker:text-red-400">
              <li>невыход ученика/педагога на занятие без предупреждения;</li>
              <li>невыход при предупреждении менее чем за <span className="font-semibold">12 часов</span> (для ученика) и <span className="font-semibold">24 часа</span> (для педагога) до запланированного урока.</li>
            </ul>
            <p className="mt-2 text-red-700 text-[13px]">* Исключения: болезнь со справкой врача, ЧС в регионе или семье, блокировка интернета с подтверждением от провайдера.</p>
          </div>

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
                <p className="text-[14px] font-semibold text-gray-800 mb-2">Примеры заданий на произвольное внимание:</p>
                <ol className="list-decimal pl-5 space-y-0.5 text-[14px] marker:text-gray-400">
                  <li>Поиск предметов на картинке</li>
                  <li>Корректурные пробы</li>
                  <li>Таблицы Шульте</li>
                  <li>Поиск отличий</li>
                </ol>
              </div>

              <div>
                <p className="text-[14px] font-semibold text-gray-800 mb-2">Примеры заданий на рабочую память (зрительную):</p>
                <ol className="list-decimal pl-5 space-y-2 text-[14px] marker:text-gray-400">
                  <li>«Что пропало?»</li>
                  <li>«Запомни ряд»</li>
                  <li>«Где была фигура?» — показать сетку 3×3 или крупнее с одной или несколькими фигурами на несколько секунд и убрать; дети либо указывают координаты фигур («второй столбик, первая строчка»), либо воспроизводят сетку в тетради.</li>
                </ol>
              </div>

              <div>
                <p className="text-[14px] font-semibold text-gray-800 mb-2">Примеры заданий на рабочую память (слуховую):</p>
                <ol className="list-decimal pl-5 space-y-2 text-[14px] marker:text-gray-400">
                  <li>«Цифры наоборот» — педагог называет ряд цифр или слов, дети повторяют в обратном порядке.</li>
                  <li>«Многоступенчатая инструкция» — например: «Встань, подними правую руку, скажи СТОП, сядь». Дети выполняют по памяти.</li>
                  <li>«Две дорожки» — педагог называет два коротких ряда цифр или слов; дети воспроизводят первый ряд в прямом порядке, а второй — в обратном, или чередуя по одному элементу из каждого ряда.</li>
                  <li>«Обратный порядок + действие» — ряд цифр (3-7-2) → дети называют в обратном порядке, прибавляя 1 к каждой цифре (3-8-4).</li>
                </ol>
              </div>
            </div>
            <div className="mt-4 flex gap-2.5 bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-[15px] text-red-900 font-semibold">
              <span className="flex-shrink-0">❗</span>
              <p>Помним: рабочая память школьника в норме удерживает 7±2 элемента!</p>
            </div>
          </div>
        </section>
  </>
);

export default GroupRegulationLesson;
