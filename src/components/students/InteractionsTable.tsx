import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { StudentRow, StudentInteraction, setInteractionOk } from '@/lib/studentsApi';
import { NameWithDot } from './studentsTableHelpers';
import InteractionsCell from './InteractionsCell';

// "не ок" — только если админ вручную поставил interaction_ok === false.
const isNotOk = (ok: boolean | null) => ok === false;

const OkCell = ({
  studentId,
  ok,
  onChange,
}: {
  studentId: number;
  ok: boolean | null;
  onChange: (ok: boolean | null) => void;
}) => {
  const [saving, setSaving] = useState(false);
  const notOk = isNotOk(ok);

  const toggle = async () => {
    setSaving(true);
    const next = notOk ? null : false; // ок(по умолч.) <-> не ок
    try {
      await setInteractionOk(studentId, next);
      onChange(next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <td className="px-3 py-3 align-top">
      <button
        onClick={toggle}
        disabled={saving}
        title={notOk ? 'Пометить «ок»' : 'Пометить «не ок» (поднять вверх)'}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
          notOk
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        }`}
      >
        <Icon name={notOk ? 'TriangleAlert' : 'Check'} size={13} />
        {notOk ? 'не ок' : 'ок'}
      </button>
    </td>
  );
};

const InteractionsTable = ({ rows }: { rows: StudentRow[] }) => {
  const [okMap, setOkMap] = useState<Record<number, boolean | null>>(
    Object.fromEntries(rows.map((s) => [s.id, s.interaction_ok])),
  );
  const [intMap, setIntMap] = useState<Record<number, StudentInteraction[]>>(
    Object.fromEntries(rows.map((s) => [s.id, s.interactions || []])),
  );

  const enriched = useMemo(
    () =>
      rows
        .map((s) => ({
          ...s,
          interaction_ok: s.id in okMap ? okMap[s.id] : s.interaction_ok,
          interactions: intMap[s.id] ?? s.interactions ?? [],
        }))
        .sort((a, b) => {
          const na = isNotOk(a.interaction_ok) ? 0 : 1;
          const nb = isNotOk(b.interaction_ok) ? 0 : 1;
          if (na !== nb) return na - nb; // "не ок" наверх
          return (a.name || '').localeCompare(b.name || '', 'ru');
        }),
    [rows, okMap, intMap],
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-left">
            <th className="px-3 py-3 font-semibold w-10">№</th>
            <th className="px-3 py-3 font-semibold">Фамилия Имя</th>
            <th className="px-3 py-3 font-semibold">ок / не ок</th>
            <th className="px-3 py-3 font-semibold">Взаимодействия</th>
          </tr>
        </thead>
        <tbody>
          {enriched.map((s, i) => (
            <tr
              key={s.id}
              className={`border-t border-gray-100 hover:bg-purple-50/50 ${
                isNotOk(s.interaction_ok) ? 'bg-red-50/40' : ''
              }`}
            >
              <td className="px-3 py-3 text-gray-400 align-top">{i + 1}</td>
              <td className="px-3 py-3 font-medium text-gray-900 align-top whitespace-nowrap">
                <NameWithDot name={s.name} statusId={s.status_id} statusName={s.status_name} />
              </td>
              <OkCell
                studentId={s.id}
                ok={s.interaction_ok}
                onChange={(ok) => setOkMap((prev) => ({ ...prev, [s.id]: ok }))}
              />
              <InteractionsCell
                studentId={s.id}
                initial={s.interactions}
                onChange={(list) => setIntMap((prev) => ({ ...prev, [s.id]: list }))}
              />
            </tr>
          ))}
          {enriched.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-gray-400">
                Нет учеников
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InteractionsTable;
