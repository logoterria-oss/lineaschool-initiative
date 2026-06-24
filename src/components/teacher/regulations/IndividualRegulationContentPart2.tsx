const IndividualRegulationContentPart2 = () => (
  <>
    <section id="after">
      <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">4. После занятия</h2>
      <p className="text-[15px] mt-4 font-medium">В течение 20 минут после урока:</p>
      <ol className="mt-3 list-decimal pl-5 space-y-3 text-[15px] marker:text-gray-400">
        <li>Видео с занятия загружаем на ЯндексДиск, в папку «Записи уроков».</li>
        <li>
          Отправляем обратную связь родителю в мессенджер.
          <div className="mt-2 flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[14px] text-amber-900">
            <span className="flex-shrink-0">⚠️</span>
            <div>
              <p className="font-semibold">Обратная связь должна содержать не только план занятия, но и слова об успехах или сложностях ученика.</p>
              <p className="mt-1"><span className="line-through text-red-500">Как не надо:</span> «Ваня сегодня был молодец».</p>
              <p className="mt-0.5"><span className="text-green-700 font-medium">Как рекомендуем:</span> «Ваня сегодня выполнил письменную работу и не пропустил ни одной гласной! Но вот «жи-ши» пока хромает».</p>
              <p className="mt-1 text-[13px]">Не делайте копипаст однотипной ОС из урока в урок — для родителей выглядит так, будто вы стоите на месте.</p>
            </div>
          </div>
        </li>
        <li>Отправляем ссылку на PDF с домашним заданием в мессенджере ученику — в том числе если ученика не было по неуважительной причине. ДЗ должно закреплять те же темы и направления, что были на уроке.</li>
        <li>Если на занятии была письменная работа, которую не проверили — просим прислать фото, чтобы разобрать ошибки на следующем занятии.</li>
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
            <p className="text-[15px] font-medium mb-3">2. Нажимаем на урок → «Провести». Если ученик отсутствовал — убираем «галочку», выставляем причину отсутствия.</p>
            <div className="flex flex-col sm:flex-row gap-3 items-start justify-center">
              <img
                src="https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/68709c92-bbc9-427c-a425-34012542034e.png"
                alt="Урок запланирован — карточка урока"
                className="w-full sm:w-1/2 rounded-lg border border-gray-200 shadow-sm"
              />
              <img
                src="https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/56c488f5-09f8-4dec-b624-5443ce01c426.png"
                alt="Проведение урока — причина отсутствия"
                className="w-full sm:w-1/2 rounded-lg border border-gray-200 shadow-sm"
              />
            </div>
          </div>
          <div>
            <p className="text-[15px] font-medium">3. В теме пишем фактический план занятия.</p>
          </div>
          <div>
            <p className="text-[15px] font-medium">4. В комментарии можем указать успехи/сложности ученика и <span className="font-bold">ОБЯЗАТЕЛЬНО</span> ссылку на видео проведённого урока — даже если ученик не подключился по неуважительной причине.</p>
            <a href="https://disk.yandex.ru/i/wg7NmV3B2qsLRw" target="_blank" rel="noopener noreferrer" className="text-[14px] mt-2 text-blue-700 underline underline-offset-2 hover:text-blue-900 block">Обучающее видео «Как скопировать ссылку на видео»</a>
          </div>
        </div>
      </div>
    </section>

    <section id="first-lesson">
      <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">5. Первое занятие с учеником</h2>
      <div className="mt-4 space-y-3 text-[15px]">
        <p>До занятия педагог обязательно заходит в карточку ученика в CRM. В виджете посещения найдите диагностическое занятие — оно светится голубым цветом. Откройте урок, перейдите по ссылке. Познакомьтесь с заключением.</p>
        <img
          src="https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/da24fcaa-1d77-4e6d-86ce-15e5f4f755e1.png"
          alt="Карточка ученика в CRM с диагностическим занятием"
          className="w-full max-w-sm mx-auto rounded-lg border border-gray-200 shadow-sm block my-4"
        />
        <p>После анализа показателей процессов чтения, письменной работы, а также в зависимости от направлений работы педагог планирует работу с учеником.</p>
        <p>Педагог отправляет сообщение родителю в мессенджер школы: ученику необходимо завести разлинованную тетрадь для логопедической работы, ручку и карандаш. Они должны быть на каждом занятии — групповом и индивидуальном. Можно использовать ручку-стиралку: меньше грязи в тетради — больше мотивации.</p>
      </div>
      <div className="mt-4 flex gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-[15px] text-blue-900">
        <span className="flex-shrink-0">💡</span>
        <p>Первое занятие — важный этап. Уделите немного больше времени знакомству: спросите об интересах ученика, поддержите его. Если интересы совпадают — обязательно расскажите об этом. Это поможет наладить доверительный контакт, что положительно скажется на процессе коррекции и впечатлении о педагоге.</p>
      </div>
      <p className="text-[15px] mt-4">После налаживания контакта переходите к упражнениям.</p>
    </section>
  </>
);

export default IndividualRegulationContentPart2;
