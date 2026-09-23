import Icon from '@/components/ui/icon';
import { MarginInputs, TeacherLine, LessonForm } from '@/lib/marginModel';

interface Props {
  inputs: MarginInputs;
  onChange: (patch: Partial<MarginInputs>) => void;
  teacherNames: string[];
}

const num = (v: string) => {
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const cell =
  'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400';

export default function MarginDirectForm({ inputs, onChange, teacherNames }: Props) {
  const setTeacher = (id: string, patch: Partial<TeacherLine>) =>
    onChange({
      teachers: inputs.teachers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });

  const addTeacher = (form: LessonForm) =>
    onChange({
      teachers: [
        ...inputs.teachers,
        {
          id: `t${Date.now()}`,
          name: '',
          form,
          rate: form === 'group' ? 650 : 650,
          perWeek: 1,
          groupSize: form === 'group' ? 4 : 1,
        },
      ],
    });

  const removeTeacher = (id: string) =>
    onChange({ teachers: inputs.teachers.filter((t) => t.id !== id) });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="Users" size={18} className="text-rose-600" />
        <h2 className="font-semibold text-gray-900">Прямые (переменные) расходы</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Всё, что тратится именно на этого ребёнка и растёт вместе с объёмом занятий:
        работа педагогов, взносы, отпускные и комиссия за приём оплаты.
        Именно из этих сумм считается маржинальность.
      </p>

      {/* Цена абонемента */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Цена абонемента, ₽</label>
          <input
            type="number"
            value={inputs.tariffPrice}
            onChange={(e) => onChange({ tariffPrice: num(e.target.value) })}
            className={cell}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Занятий в абонементе</label>
          <input
            type="number"
            value={inputs.tariffLessons}
            onChange={(e) => onChange({ tariffLessons: num(e.target.value) })}
            className={cell}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Срок, мес.</label>
          <input
            type="number"
            value={inputs.tariffMonths}
            onChange={(e) => onChange({ tariffMonths: num(e.target.value) })}
            className={cell}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Эквайринг, %</label>
          <input
            type="number"
            step="0.01"
            value={inputs.acquiringPercent}
            onChange={(e) => onChange({ acquiringPercent: num(e.target.value) })}
            className={cell}
          />
        </div>
      </div>

      {/* Педагоги */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-700">
            Состав недели и ставки педагогов
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => addTeacher('group')}
              className="text-xs px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              + групповой
            </button>
            <button
              onClick={() => addTeacher('individual')}
              className="text-xs px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              + индивидуальный
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr className="text-xs text-gray-500 text-left">
                <th className="pb-1.5 font-medium">Педагог</th>
                <th className="pb-1.5 font-medium w-32">Формат</th>
                <th className="pb-1.5 font-medium w-28">Ставка, ₽</th>
                <th className="pb-1.5 font-medium w-24">Зан./нед.</th>
                <th className="pb-1.5 font-medium w-28">В группе, чел.</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {inputs.teachers.map((t) => (
                <tr key={t.id} className="border-t border-gray-100">
                  <td className="py-1.5 pr-2">
                    <input
                      list="margin-teacher-names"
                      value={t.name}
                      placeholder="имя из CRM"
                      onChange={(e) => setTeacher(t.id, { name: e.target.value })}
                      className={cell}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <select
                      value={t.form}
                      onChange={(e) =>
                        setTeacher(t.id, {
                          form: e.target.value as LessonForm,
                          groupSize: e.target.value === 'group' ? t.groupSize || 4 : 1,
                        })
                      }
                      className={cell}
                    >
                      <option value="group">групповой</option>
                      <option value="individual">индивид.</option>
                    </select>
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      value={t.rate}
                      onChange={(e) => setTeacher(t.id, { rate: num(e.target.value) })}
                      className={cell}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      step="0.5"
                      value={t.perWeek}
                      onChange={(e) => setTeacher(t.id, { perWeek: num(e.target.value) })}
                      className={cell}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      step="0.1"
                      disabled={t.form === 'individual'}
                      value={t.form === 'individual' ? 1 : t.groupSize}
                      onChange={(e) => setTeacher(t.id, { groupSize: num(e.target.value) })}
                      className={`${cell} disabled:bg-gray-50 disabled:text-gray-400`}
                    />
                  </td>
                  <td className="py-1.5 text-right">
                    <button
                      onClick={() => removeTeacher(t.id)}
                      className="text-gray-300 hover:text-red-500"
                      title="Убрать строку"
                    >
                      <Icon name="X" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {inputs.teachers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-sm text-gray-400">
                    Добавьте занятия, из которых состоит неделя ребёнка
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <datalist id="margin-teacher-names">
          {teacherNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>

        <p className="text-xs text-gray-500 mt-2">
          Размер группы подставляется из CRM по факту месяца. Групповой урок
          делится между детьми — абонемент оплачивает свою долю часа педагога.
        </p>
      </div>

      {/* Взносы и отпускные */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Взносы в СФР, % от ЗП</label>
          <input
            type="number"
            step="0.1"
            value={inputs.sfrPercent}
            onChange={(e) => onChange({ sfrPercent: num(e.target.value) })}
            className={cell}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Отпускные: 1/N от начисленного
          </label>
          <input
            type="number"
            step="0.1"
            value={inputs.vacationDivisor}
            onChange={(e) => onChange({ vacationDivisor: num(e.target.value) })}
            className={cell}
          />
        </div>
      </div>
    </div>
  );
}