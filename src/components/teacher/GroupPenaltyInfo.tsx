import Icon from '@/components/ui/icon';

const PENALTY_ROWS = [
  {
    n: 1,
    violation: 'Предупреждение об отмене или переносе занятия менее чем за 24 часа (без уважительной причины)',
    penalty: '–1',
    meaning:
      'Если вы предупреждаете, что не проведёте урок, меньше чем за сутки до его начала, и у вас нет веской причины (уважительные причины прописаны в регламенте), средний балл будет снижен на 1.',
  },
  {
    n: 2,
    violation: 'Невыход на занятие без предупреждения (без уважительной причины)',
    penalty: '–2',
    meaning:
      'Если вы просто не приходите на урок и даже не предупреждаете об этом заранее (и нет уважительной причины) — штраф –2 балла. Это самое серьёзное нарушение.',
  },
  {
    n: 3,
    violation: 'Отсутствие ссылок на занятия (или ссылки отправлены после 10:00 по Москве)',
    penalty: 'до –2',
    meaning:
      'Вы должны заранее подготовить и прислать ссылку на занятие в чат "Уроки". Если ссылки систематически отправляются позднее 10:00 по Мск, вы можете получить до –2 баллов (на усмотрение руководителя).',
  },
  {
    n: 4,
    violation: 'Отсутствие записи занятия в карточке урока CRM',
    penalty: 'до –2',
    meaning:
      'Если вы систематически не прикрепляете ссылки на записи уроков, штраф также до –2 баллов (на усмотрение руководителя).',
  },
  {
    n: 5,
    violation: 'Уроки не проведены в CRM после 00:00',
    penalty: 'до –2',
    meaning:
      'Все проведённые занятия нужно регистрировать в CRM в идеале сразу после урока, но строго до 00:00 (по Мск) текущего дня. Если вы систематически не проводите занятия в CRM вовремя, начисляется штраф до –2 баллов (на усмотрение руководителя).',
  },
];

interface GroupPenaltyInfoProps {
  exampleBaseScore?: number;
  examplePenalty?: number;
  exampleFinalScore?: number;
  exampleBonus?: string;
  exampleHigherBonus?: string;
}

const GroupPenaltyInfo = ({
  exampleBaseScore = 30,
  examplePenalty = 2,
  exampleFinalScore = 28,
  exampleBonus = '+100 ₽/час',
  exampleHigherBonus = '+200',
}: GroupPenaltyInfoProps) => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-gray-700 mb-3">
        В дополнение к оценкам за супервизии, в каждом отчётном периоде (3 месяца) фиксируются ваши
        дисциплинарные и организационные нарушения. За каждое нарушение начисляются штрафные баллы (со
        знаком минус). Штрафные баллы вычитаются из вашего среднего балла, полученного по супервизиям.
      </p>
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-gray-800 font-medium">
        Итоговый средний балл за период = (средний балл супервизий) − (сумма штрафных баллов).
      </div>
      <p className="text-gray-700 mt-3">
        Именно этот итоговый балл определит вашу премиальную ставку на следующий квартал.
      </p>
    </div>

    <div>
      <h3 className="font-semibold text-gray-900 mb-3">Таблица нарушений и штрафов</h3>

      {/* Десктоп */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="text-left font-semibold px-3 py-3 border-b border-gray-200 w-10">№</th>
              <th className="text-left font-semibold px-3 py-3 border-b border-gray-200">Нарушение</th>
              <th className="text-left font-semibold px-3 py-3 border-b border-gray-200 w-28">Штраф (баллы)</th>
              <th className="text-left font-semibold px-3 py-3 border-b border-gray-200">Что это значит на практике</th>
            </tr>
          </thead>
          <tbody>
            {PENALTY_ROWS.map((r) => (
              <tr key={r.n} className="border-b border-gray-100 last:border-b-0 align-top">
                <td className="px-3 py-3 text-gray-500">{r.n}</td>
                <td className="px-3 py-3 text-gray-800">{r.violation}</td>
                <td className="px-3 py-3 font-semibold text-red-600 whitespace-nowrap">{r.penalty}</td>
                <td className="px-3 py-3 text-gray-600">{r.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Мобильные карточки */}
      <div className="md:hidden space-y-3">
        {PENALTY_ROWS.map((r) => (
          <div key={r.n} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="font-semibold text-gray-900">
                {r.n}. {r.violation}
              </p>
              <span className="font-semibold text-red-600 whitespace-nowrap">{r.penalty}</span>
            </div>
            <p className="text-sm text-gray-600">{r.meaning}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 mb-2">Как это применяется к вашему среднему баллу</h3>
      <p className="text-gray-700 mb-2"><span className="font-semibold">Пример:</span></p>
      <p className="text-gray-700 mb-3">
        За отчётный период (например, январь–март) ваш средний балл по супервизиям составил {exampleBaseScore}. В этом
        же периоде вы:
      </p>
      <ul className="space-y-1.5 mb-4">
        <li className="flex items-start gap-2 text-gray-700">
          <Icon name="Minus" size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          1 раз отменили занятие за 12 часов (без уважительной причины) → штраф –1;
        </li>
        <li className="flex items-start gap-2 text-gray-700">
          <Icon name="Minus" size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          3 раза отправили ссылки после 10:00 → за это вам выставили –1 (половина от максимума).
        </li>
      </ul>
      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-gray-700">
        Итоговый средний балл = {exampleBaseScore} – {examplePenalty} ={' '}
        <span className="font-semibold">{exampleFinalScore}</span>. Теперь ваша премия будет
        рассчитываться уже из балла {exampleFinalScore}, что соответствует надбавке{' '}
        <span className="font-semibold">{exampleBonus}</span> (а не {exampleHigherBonus}, как было бы при {exampleBaseScore}).
      </div>
    </div>

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 mb-2">Важные нюансы</h3>
      <ul className="space-y-2">
        <li className="flex items-start gap-2 text-gray-700">
          <Icon name="Info" size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          Штрафы суммируются за весь отчётный период (3 месяца).
        </li>
        <li className="flex items-start gap-2 text-gray-700">
          <Icon name="Info" size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          Уважительные причины прописаны в регламенте, подтверждаются документально и согласовываются с
          руководством — в таком случае штрафные баллы не начисляются.
        </li>
      </ul>
    </div>
  </div>
);

export default GroupPenaltyInfo;