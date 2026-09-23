import Icon from '@/components/ui/icon';
import { CrmTariff, CrmMonth } from '@/lib/marginApi';
import { monthLabel, recentMonths, fmtMoney, currentMonth } from '@/lib/marginModel';

interface Props {
  tariffs: CrmTariff[];
  tariffKey: string;
  onTariffChange: (key: string) => void;
  month: string;
  onMonthChange: (m: string) => void;
  crm: CrmMonth | null;
  crmLoading: boolean;
  crmError: string;
  onRefreshCrm: () => void;
}

/** Абонементы в списке: сначала действующие, потом архивные — с подписью. */
const groupTariffs = (list: CrmTariff[]) => ({
  actual: list.filter((t) => !t.is_archived),
  archived: list.filter((t) => t.is_archived),
});

export default function MarginSetup({
  tariffs, tariffKey, onTariffChange, month, onMonthChange,
  crm, crmLoading, crmError, onRefreshCrm,
}: Props) {
  const { actual, archived } = groupTariffs(tariffs);
  const label = (t: CrmTariff) =>
    `${t.name} — ${fmtMoney(t.price)} / ${t.lessons_count} зан.`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Абонемент
          </label>
          <select
            value={tariffKey}
            onChange={(e) => onTariffChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">— выберите абонемент —</option>
            {actual.length > 0 && (
              <optgroup label="Действующие">
                {actual.map((t) => (
                  <option key={t.id} value={String(t.id)}>{label(t)}</option>
                ))}
              </optgroup>
            )}
            {archived.length > 0 && (
              <optgroup label="Архивные (по ним ещё учатся)">
                {archived.map((t) => (
                  <option key={t.id} value={String(t.id)}>{label(t)}</option>
                ))}
              </optgroup>
            )}
          </select>
          <p className="text-xs text-gray-500 mt-1.5">
            Список берётся из CRM целиком: и текущая линейка, и старая — по ней
            занимается часть детей.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Месяц расчёта
          </label>
          <div className="flex gap-2">
            <select
              value={month}
              onChange={(e) => onMonthChange(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {recentMonths(24).map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
            <button
              onClick={onRefreshCrm}
              disabled={crmLoading}
              className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
              title="Пересчитать данные из CRM"
            >
              <Icon
                name="RefreshCw"
                size={15}
                className={crmLoading ? 'animate-spin' : ''}
              />
              CRM
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            По месяцу подтягиваются педагоги, размеры групп и масштаб школы.
          </p>
        </div>
      </div>

      {crmError && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {crmError}
        </div>
      )}

      {crmLoading && !crm && (
        <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
          <Icon name="Loader2" size={15} className="animate-spin" />
          Считаем месяц по данным CRM — это занимает до минуты
        </div>
      )}

      {/* Незакрытый месяц: занятий пока меньше, чем будет к 30-му числу,
          поэтому доля косвенных расходов на абонемент выходит завышенной.
          Молча показывать такую цифру нельзя — её примут за факт. */}
      {crm && month === currentMonth() && (
        <div className="mt-4 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          Месяц ещё идёт: в CRM попали только проведённые занятия. Объём школы
          занижен, а доля косвенных расходов на абонемент — завышена. Для
          итоговых выводов берите закрытый месяц.
        </div>
      )}

      {crm && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Выручка школы', value: fmtMoney(crm.total_revenue) },
            { label: 'Ученико-уроков', value: crm.total_student_lessons },
            { label: 'Учеников', value: crm.students_total },
            { label: 'Занятий проведено', value: crm.total_lessons },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-lg px-3 py-2.5">
              <div className="text-xs text-gray-500">{s.label}</div>
              <div className="text-base font-semibold text-gray-900">{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}