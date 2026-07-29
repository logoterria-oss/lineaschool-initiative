const GroupRegulationAfter = () => (
  <>
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
                <p className="text-[15px] font-medium mb-3">2. Нажимаем на урок → «Провести», проверяем список учеников. Если ученик отсутствовал — убираем «галочку», выставляем причину отсутствия.</p>
                <div className="flex flex-col sm:flex-row gap-3 items-start justify-center">
                  <img
                    src="https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/9fcc5a92-d715-454c-89fe-4d22c3a5f36d.png"
                    alt="Карточка группового урока"
                    className="w-full sm:w-1/2 rounded-lg border border-gray-200 shadow-sm"
                  />
                  <img
                    src="https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/8e7e6e8e-dfd8-4fab-8d74-295a435be447.png"
                    alt="Проведение группового урока — причина отсутствия"
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
  </>
);

export default GroupRegulationAfter;
