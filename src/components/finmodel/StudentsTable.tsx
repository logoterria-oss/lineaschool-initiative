import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { StudentsData, StudentsRow, StudentsSource, fmMonthLabel } from '@/lib/finmodelApi';

interface Props {
  data: StudentsData;
  onClose: (month: string) => Promise<void>;
  onManual: (month: string, v: { active_students: number; total_lessons: number; avg_group_fill: number | null }) => Promise<void>;
}

const SOURCE: Record<StudentsSource, { label: string; cls: string }> = {
  alfa: { label: 'AlfaCRM', cls: 'bg-violet-50 text-violet-700' },
  report: { label: 'отчёт', cls: 'bg-blue-50 text-blue-700' },
  manual: { label: 'вручную', cls: 'bg-amber-50 text-amber-700' },
};

const num = (v: number | null | undefined, d = 0) =>
  v === null || v === undefined ? '—' : Number(v).toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d });

function ManualForm({ row, onSave, onCancel }: { row: StudentsRow; onSave: Props['onManual']; onCancel: () => void }) {
  const [active, setActive] = useState(row.active_students?.toString() ?? '');
  const [lessons, setLessons] = useState(row.total_lessons?.toString() ?? '');
  const [fill, setFill] = useState(row.avg_group_fill?.toString().replace('.', ',') ?? '');
  const [busy, setBusy] = useState(false);
  const a = Number(active);
  const l = Number(lessons);
  const ok = a > 0 && lessons !== '' && l >= 0;
  const input = 'w-20 border border-gray-300 rounded px-2 py-1 text-right text-sm';

  const save = async () => {
    setBusy(true);
    try {
      await onSave(row.month_id, {
        active_students: a,
        total_lessons: l,
        avg_group_fill: fill.trim() ? Number(fill.replace(',', '.')) : null,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="bg-amber-50/40">
      <td className="px-4 py-2 font-medium">{fmMonthLabel(row.month_id)}</td>
      <td className="px-4 py-2 text-right"><input className={input} value={active} onChange={(e) => setActive(e.target.value)} inputMode="numeric" /></td>
      <td className="px-4 py-2 text-right"><input className={input} value={lessons} onChange={(e) => setLessons(e.target.value)} inputMode="numeric" /></td>
      <td className="px-4 py-2 text-right tabular-nums text-gray-500">{ok ? num(l / a, 2) : '—'}</td>
      <td className="px-4 py-2 text-right"><input className={input} value={fill} onChange={(e) => setFill(e.target.value)} inputMode="decimal" placeholder="—" /></td>
      <td className="px-4 py-2" colSpan={2}>
        <div className="flex gap-2 justify-end">
          <button disabled={!ok || busy} onClick={save} className="px-3 py-1 rounded bg-gray-900 text-white text-xs disabled:opacity-40">
            {busy ? 'Сохраняем…' : 'Сохранить и закрыть'}
          </button>
          <button onClick={onCancel} className="px-3 py-1 rounded border border-gray-300 text-xs text-gray-600">Отмена</button>
        </div>
      </td>
    </tr>
  );
}

/** Ученики и занятия по месяцам — справочно, в переменных расходах не участвуют. */
export default function StudentsTable({ data, onClose, onManual }: Props) {
  const [edit, setEdit] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);

  const close = async (m: string) => {
    setClosing(m);
    try {
      await onClose(m);
    } finally {
      setClosing(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Ученики и занятия</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Справочно, в расчёт переменных расходов не входит. Все показатели уже есть в отчётах админки, отдельное
          подключение AlfaCRM не нужно: активные ученики — «Динамика учеников» (последняя неделя месяца), занятия и
          наполняемость — «Маржинальность урока». Уроков на ученика = всего занятий ÷ активные ученики.
          С 1-го числа прошлый месяц можно закрыть цифрами отчётов или ввести вручную — после закрытия данные не
          меняются.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Месяц</th>
              <th className="text-right px-4 py-2 font-medium">Активных учеников</th>
              <th className="text-right px-4 py-2 font-medium">Всего занятий</th>
              <th className="text-right px-4 py-2 font-medium">Уроков на ученика</th>
              <th className="text-right px-4 py-2 font-medium">Наполняемость группы</th>
              <th className="text-left px-4 py-2 font-medium">Источник</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.rows.map((r) => {
              if (edit === r.month_id) {
                return (
                  <ManualForm
                    key={r.month_id}
                    row={r}
                    onCancel={() => setEdit(null)}
                    onSave={async (m, v) => {
                      await onManual(m, v);
                      setEdit(null);
                    }}
                  />
                );
              }
              const empty = r.active_students === null && r.total_lessons === null;
              const src = SOURCE[r.source];
              return (
                <tr key={r.month_id} className={r.state === 'current' ? 'text-gray-500' : ''}>
                  <td className="px-4 py-2 font-medium">
                    {fmMonthLabel(r.month_id)}
                    {r.state === 'current' && <span className="ml-2 text-xs font-normal text-gray-400">идёт</span>}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.active_students)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.total_lessons)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.avg_lessons_per_student, 2)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.avg_group_fill, 2)}</td>
                  <td className="px-4 py-2 text-xs whitespace-nowrap">
                    {!empty && <span className={`px-2 py-0.5 rounded ${src.cls}`}>{src.label}</span>}
                    {r.closed ? (
                      <Icon name="Lock" size={13} className="inline ml-2 text-gray-400" />
                    ) : (
                      r.state === 'open' && !r.report_complete && r.total_lessons !== null && (
                        <span className="ml-2 text-amber-600">отчёт снят до конца месяца</span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    {r.state === 'open' && (
                      <div className="flex gap-2 justify-end">
                        {r.report_complete && r.active_students && r.total_lessons !== null && (
                          <button
                            onClick={() => close(r.month_id)}
                            disabled={closing === r.month_id}
                            className="px-3 py-1 rounded bg-emerald-600 text-white text-xs disabled:opacity-50"
                          >
                            {closing === r.month_id ? 'Закрываем…' : 'Закрыть'}
                          </button>
                        )}
                        <button onClick={() => setEdit(r.month_id)} className="px-3 py-1 rounded border border-gray-300 text-xs text-gray-600 hover:bg-gray-50">
                          Вручную
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}