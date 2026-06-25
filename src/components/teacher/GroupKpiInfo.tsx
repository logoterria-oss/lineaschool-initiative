import Icon from '@/components/ui/icon';

const BONUS_ROWS = [
  { score: 'от 24 до 28', bonus: '+ 100 ₽', total: '400 ₽' },
  { score: 'от 29 до 32', bonus: '+ 200 ₽', total: '500 ₽' },
  { score: 'от 33 до 35', bonus: '+ 350 ₽', total: '650 ₽' },
];

const PERIODS = ['январь – март', 'апрель – июнь', 'июль – сентябрь', 'октябрь – декабрь'];

const GroupKpiInfo = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-gray-800 mb-4">Ваша зарплата состоит из двух частей:</p>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 flex-shrink-0">
            <Icon name="Wallet" size={18} className="text-blue-600" />
          </div>
          <p className="text-gray-700">
            <span className="font-semibold text-gray-900">Окладная часть:</span> 300 ₽ за час работы.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 flex-shrink-0">
            <Icon name="TrendingUp" size={18} className="text-emerald-600" />
          </div>
          <p className="text-gray-700">
            <span className="font-semibold text-gray-900">Премиальная часть:</span> зависит от вашего
            среднего балла за последний отчётный период. Размер премии добавляется к базовой ставке и
            действует весь следующий период.
          </p>
        </div>
      </div>
    </div>

    {/* Таблица премий — десктоп */}
    <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-600">
            <th className="text-left font-semibold px-4 py-3 border-b border-gray-200">Если ваш средний балл…</th>
            <th className="text-left font-semibold px-4 py-3 border-b border-gray-200">То ваша премия за час составит…</th>
            <th className="text-left font-semibold px-4 py-3 border-b border-gray-200">Итого ваша ставка за час будет…</th>
          </tr>
        </thead>
        <tbody>
          {BONUS_ROWS.map((r) => (
            <tr key={r.score} className="border-b border-gray-100 last:border-b-0">
              <td className="px-4 py-3 text-gray-800">{r.score}</td>
              <td className="px-4 py-3 font-semibold text-emerald-700">{r.bonus}</td>
              <td className="px-4 py-3 font-semibold text-gray-900">{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Таблица премий — мобильные карточки */}
    <div className="md:hidden space-y-2">
      {BONUS_ROWS.map((r) => (
        <div key={r.score} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">Средний балл</p>
          <p className="font-semibold text-gray-900 mb-3">{r.score}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Премия за час</span>
            <span className="font-semibold text-emerald-700">{r.bonus}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Ставка за час</span>
            <span className="font-semibold text-gray-900">{r.total}</span>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 mb-2">Как и когда считается средний балл?</h3>
      <p className="text-gray-700 mb-4">
        Балл вычисляется на основе результатов супервизий (контрольных оценок вашей работы) за
        отчётный период.
      </p>
      <p className="text-gray-700 mb-2">Отчётные периоды длятся по 3 месяца и распределены так:</p>
      <ul className="space-y-1.5">
        {PERIODS.map((p) => (
          <li key={p} className="flex items-center gap-2 text-gray-700">
            <Icon name="Calendar" size={16} className="text-emerald-600 flex-shrink-0" />
            {p}
          </li>
        ))}
      </ul>
    </div>

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 mb-2">Как действует премия?</h3>
      <p className="text-gray-700 mb-3">
        По итогам каждого отчётного периода определяется ваш средний балл. Соответствующая этому баллу
        премия назначается на весь следующий отчётный период.
      </p>
      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-gray-700">
        <span className="font-semibold text-emerald-800">Например:</span> по итогам января–марта
        средний балл по итогам супервизии = 30 → значит, в апреле–июне вы будете получать 300 ₽ + 200 ₽
        = <span className="font-semibold">500 ₽/час</span>.
      </div>
      <p className="text-gray-700 mt-3">
        В следующем периоде балл пересчитывается заново, и премиальная часть может измениться.
      </p>
    </div>
  </div>
);

export default GroupKpiInfo;
