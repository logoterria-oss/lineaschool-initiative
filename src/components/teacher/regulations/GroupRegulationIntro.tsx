const GroupRegulationIntro = () => (
  <>
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
  </>
);

export default GroupRegulationIntro;
