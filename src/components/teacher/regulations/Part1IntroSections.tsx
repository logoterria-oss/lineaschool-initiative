const Part1IntroSections = () => (
  <>
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
  </>
);

export default Part1IntroSections;
