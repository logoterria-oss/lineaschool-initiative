import { StudentRow } from '@/lib/studentsApi';
import { NameWithDot } from './studentsTableHelpers';

// Абонемент коротко: «арх. 4 ур/нед (3 мес.)» + остаток оплаченных занятий.
const TariffCell = ({ s }: { s: StudentRow }) => {
  const t = s.tariff;
  if (!t) return <td className="px-3 py-3 align-top text-gray-300">—</td>;

  return (
    <td className="px-3 py-3 align-top">
      <div className="flex flex-col">
        <span className="text-gray-800">
          {t.is_archived && <span className="text-gray-400">арх. </span>}
          {t.short_name || t.name}
        </span>
        <span className={`text-xs ${t.is_active ? 'text-green-600' : 'text-gray-400'}`}>
          {t.is_active ? `остаток ${t.paid_lessons_left}` : 'нет оплаченных'}
          {t.shared_with_siblings && <span className="text-purple-500"> · с сиблингом</span>}
        </span>
      </div>
    </td>
  );
};

// Фактически поставленные уроки из CRM: «2 гр + 2 инд».
const plannedLabel = (p: StudentRow['planned_lessons']) => {
  if (!p || !p.total) return null;
  const parts: string[] = [];
  if (p.group) parts.push(`${p.group} гр`);
  if (p.individual) parts.push(`${p.individual} инд`);
  return parts.join(' + ');
};

const PlannedCell = ({ s }: { s: StudentRow }) => {
  const label = plannedLabel(s.planned_lessons);
  return (
    <td className="px-3 py-3 align-top whitespace-nowrap">
      {label ? (
        <span className="text-gray-800">{label}</span>
      ) : (
        <span className="text-amber-600">нет</span>
      )}
    </td>
  );
};

// Совпадает ли расписание с оплаченным абонементом. Правила считает бэкенд:
// «2 ур/нед» — 2 групповых (1 гр + 1 инд допустимо, но с предупреждением),
// «3 ур/нед» — 2 гр + 1 инд, «4 ур/нед» — 2 гр + 2 инд,
// индивидуальный — любое количество индивидуальных.
const MATCH_STYLES: Record<string, { cls: string; label: string }> = {
  ok: { cls: 'bg-green-100 text-green-700', label: 'да' },
  warn: { cls: 'bg-amber-100 text-amber-700', label: 'проверить' },
  bad: { cls: 'bg-red-100 text-red-700', label: 'нет' },
};

const MatchCell = ({ s }: { s: StudentRow }) => {
  const status = s.match_status;
  const style = status ? MATCH_STYLES[status] : undefined;

  if (!style) {
    return (
      <td className="px-3 py-3 align-top text-gray-300" title={s.match_note || ''}>
        —
      </td>
    );
  }

  return (
    <td className="px-3 py-3 align-top">
      <span
        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${style.cls}`}
        title={s.match_note || ''}
      >
        {style.label}
      </span>
      {s.match_note && status !== 'ok' && (
        <div className="text-[11px] text-gray-500 mt-1 max-w-[220px]">{s.match_note}</div>
      )}
    </td>
  );
};

// ПДУ — промежуточная диагностика. Пора, если прошло 3 месяца и больше.
const DiagCell = ({ s }: { s: StudentRow }) => {
  const last = s.last_diagnostic;
  if (!last) {
    return (
      <td className="px-3 py-3 align-top">
        <span
          className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700"
          title="Диагностик ещё не было"
        >
          пора
        </span>
      </td>
    );
  }

  const lastDate = new Date(last);
  const limit = new Date();
  limit.setMonth(limit.getMonth() - 3);
  const due = lastDate <= limit;
  const human = last.split('-').reverse().join('.');

  return (
    <td className="px-3 py-3 align-top whitespace-nowrap">
      <span
        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
          due ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
        }`}
        title={`Последняя диагностика: ${human}`}
      >
        {due ? 'пора' : 'не пора'}
      </span>
    </td>
  );
};

const MainTable = ({ rows }: { rows: StudentRow[] }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-left">
            <th className="px-3 py-3 font-semibold w-12">№</th>
            <th className="px-3 py-3 font-semibold">Фамилия Имя</th>
            <th className="px-3 py-3 font-semibold">Оплаченный абонемент</th>
            <th className="px-3 py-3 font-semibold">Запланировано</th>
            <th className="px-3 py-3 font-semibold">Соответствует?</th>
            <th className="px-3 py-3 font-semibold">ПДУ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => (
            <tr key={s.id} className="border-t border-gray-100 hover:bg-purple-50/50">
              <td className="px-3 py-3 text-gray-400 align-top">{i + 1}</td>
              <td className="px-3 py-3 align-top font-medium text-gray-900">
                <NameWithDot name={s.name} statusId={s.status_id} statusName={s.status_name} />
              </td>
              <TariffCell s={s} />
              <PlannedCell s={s} />
              <MatchCell s={s} />
              <DiagCell s={s} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default MainTable;
