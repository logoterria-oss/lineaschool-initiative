const Part1LessonDyslexia = () => (
  <>
    {/* 3.3 Коррекция дислексии */}
      <div id="dyslexia" className="mt-10">
        <h3 className="text-base font-bold text-gray-900 text-center mb-3 mt-2">Коррекция дислексии</h3>
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
          <h4 className="text-[15px] font-bold text-gray-900 text-center mb-3">Техника чтения</h4>
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
          <h4 className="text-[15px] font-bold text-gray-900 text-center mb-3">Развитие понимания прочитанного</h4>
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
  </>
);

export default Part1LessonDyslexia;
