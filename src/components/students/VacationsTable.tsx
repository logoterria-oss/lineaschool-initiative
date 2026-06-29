import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  StudentRow,
  StudentVacation,
  VacationEndType,
  FirstLessonStatus,
  saveVacation,
} from '@/lib/studentsApi';
import { NameWithDot, fmtDate } from './studentsTableHelpers';

// ────── helpers ──────────────────────────────────────────────────────────────

const MONTHS_RU = [
  'январе', 'феврале', 'марте', 'апреле', 'мае', 'июне',
  'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре',
];

const formatVacationEnd = (v: StudentVacation): string => {
  if (!v.date_to) return '—';
  const d = new Date(v.date_to);
  if (v.vacation_end_type === 'mid_month')
    return `до середины ${MONTHS_RU[d.getMonth()]} ${d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() : ''}`.trim();
  if (v.vacation_end_type === 'end_month')
    return `до конца ${MONTHS_RU[d.getMonth()]} ${d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() : ''}`.trim();
  return fmtDate(v.date_to);
};

const firstLessonBadge = (status: FirstLessonStatus) => {
  if (status === 'paid') return 'bg-green-100 text-green-700';
  if (status === 'agreed') return 'bg-gray-100 text-gray-600';
  return '';
};

// ────── VacationEditor ───────────────────────────────────────────────────────

const VacationEditor = ({
  studentId,
  initial,
  onSaved,
}: {
  studentId: number;
  initial: StudentVacation | null;
  onSaved: (v: StudentVacation) => void;
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [dateTo, setDateTo] = useState(initial?.date_to ?? '');
  const [endType, setEndType] = useState<VacationEndType>(initial?.vacation_end_type ?? 'exact');
  const [flDate, setFlDate] = useState(initial?.first_lesson_date ?? '');
  const [flStatus, setFlStatus] = useState<FirstLessonStatus>(initial?.first_lesson_status ?? 'not_agreed');
  const [saving, setSaving] = useState(false);

  const save = async (patch: Partial<Omit<StudentVacation, 'id'>>) => {
    setSaving(true);
    try {
      const merged: Partial<Omit<StudentVacation, 'id'>> = {
        date_from: initial?.date_from ?? today,
        date_to: dateTo || null,
        vacation_end_type: endType,
        first_lesson_date: flDate || null,
        first_lesson_status: flStatus,
        note: initial?.note ?? '',
        ...patch,
      };
      await saveVacation(studentId, merged);
      onSaved({ id: initial?.id ?? 0, ...merged } as StudentVacation);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* ── конец каникул ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 w-28">Конец каникул:</span>
        <select
          value={endType}
          onChange={e => {
            setEndType(e.target.value as VacationEndType);
            save({ vacation_end_type: e.target.value as VacationEndType });
          }}
          className="h-8 px-2 rounded border border-gray-200 text-xs text-gray-700"
        >
          <option value="exact">Конкретная дата</option>
          <option value="mid_month">До середины месяца</option>
          <option value="end_month">До конца месяца</option>
        </select>
        <Input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          onBlur={() => save({ date_to: dateTo || null, vacation_end_type: endType })}
          className="h-8 text-xs w-36"
        />
      </div>

      {/* ── первый урок ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 w-28">Первый урок:</span>
        <Input
          type="date"
          value={flDate}
          onChange={e => setFlDate(e.target.value)}
          onBlur={() => save({ first_lesson_date: flDate || null, first_lesson_status: flStatus })}
          className="h-8 text-xs w-36"
          placeholder="дата"
        />
        {flDate && (
          <select
            value={flStatus}
            onChange={e => {
              setFlStatus(e.target.value as FirstLessonStatus);
              save({ first_lesson_date: flDate || null, first_lesson_status: e.target.value as FirstLessonStatus });
            }}
            className="h-8 px-2 rounded border border-gray-200 text-xs text-gray-700"
          >
            <option value="paid">Оплачен</option>
            <option value="agreed">Согласован</option>
            <option value="not_agreed">Не согласован</option>
          </select>
        )}
        {saving && <span className="text-xs text-gray-400">…</span>}
      </div>
    </div>
  );
};

// ────── DateCell (универсальная редактируемая ячейка с датой) ────────────────

const DateCell = ({
  value,
  placeholder,
  onSave,
}: {
  value: string | null;
  placeholder: string;
  onSave: (date: string | null) => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [displayed, setDisplayed] = useState(value);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft || null);
      setDisplayed(draft || null);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <td className="px-3 py-3 align-top">
        <Input type="date" value={draft} onChange={e => setDraft(e.target.value)} className="h-8 text-xs w-36" />
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={save} disabled={saving} className="h-7 text-xs">{saving ? '…' : 'ОК'}</Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="h-7 text-xs">Отмена</Button>
        </div>
      </td>
    );
  }

  return (
    <td className="px-3 py-3 align-top text-sm text-gray-700 group">
      <div className="flex items-center gap-2">
        <span>{displayed ? fmtDate(displayed) : <span className="text-gray-400 text-xs italic">{placeholder}</span>}</span>
        <button
          onClick={() => { setDraft(displayed ?? ''); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 transition-opacity flex-shrink-0"
          title="Редактировать"
        >
          <Icon name="Pencil" size={13} />
        </button>
      </div>
    </td>
  );
};

// ────── VacationCell ─────────────────────────────────────────────────────────

const VacationCell = ({
  s,
  onUpdate,
}: {
  s: StudentRow;
  onUpdate: (id: number, v: StudentVacation) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const v = s.vacation;

  if (editing) {
    return (
      <td className="px-3 py-3 align-top" colSpan={1}>
        <VacationEditor
          studentId={s.id}
          initial={v}
          onSaved={saved => { onUpdate(s.id, saved); setEditing(false); }}
        />
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="mt-2 h-7 text-xs text-gray-400">
          Закрыть
        </Button>
      </td>
    );
  }

  return (
    <td className="px-3 py-3 align-top text-sm text-gray-700 group">
      <div className="flex items-start gap-2">
        <span>{v ? formatVacationEnd(v) : <span className="text-gray-400 text-xs italic">не указано</span>}</span>
        <button
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 transition-opacity flex-shrink-0 mt-0.5"
          title="Редактировать"
        >
          <Icon name="Pencil" size={13} />
        </button>
      </div>
    </td>
  );
};

const FirstLessonCell = ({ s, onUpdate }: { s: StudentRow; onUpdate: (id: number, v: StudentVacation) => void }) => {
  const v = s.vacation;
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(v?.first_lesson_date ?? '');
  const [status, setStatus] = useState<FirstLessonStatus>(v?.first_lesson_status ?? 'not_agreed');
  const [saving, setSaving] = useState(false);

  const save = async (d: string, st: FirstLessonStatus) => {
    setSaving(true);
    try {
      const merged: Partial<Omit<StudentVacation, 'id'>> = {
        date_from: v?.date_from ?? new Date().toISOString().slice(0, 10),
        date_to: v?.date_to ?? null,
        vacation_end_type: v?.vacation_end_type ?? 'exact',
        first_lesson_date: d || null,
        first_lesson_status: st,
        note: v?.note ?? '',
      };
      await saveVacation(s.id, merged);
      onUpdate(s.id, { id: v?.id ?? 0, ...merged } as StudentVacation);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <td className="px-3 py-3 align-top">
        <div className="flex items-center gap-2 flex-wrap">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 text-xs w-36" />
          <select
            value={status}
            onChange={e => setStatus(e.target.value as FirstLessonStatus)}
            className="h-8 px-2 rounded border border-gray-200 text-xs"
          >
            <option value="paid">Оплачен</option>
            <option value="agreed">Согласован</option>
            <option value="not_agreed">Не согласован</option>
          </select>
        </div>
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={() => save(date, status)} disabled={saving} className="h-7 text-xs">
            {saving ? '…' : 'ОК'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="h-7 text-xs">
            Отмена
          </Button>
        </div>
      </td>
    );
  }

  const fl = v?.first_lesson_date;
  const st = v?.first_lesson_status ?? 'not_agreed';
  return (
    <td className="px-3 py-3 align-top group">
      <div className="flex items-center gap-2">
        {fl ? (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${firstLessonBadge(st)}`}>
            {st === 'paid' && <Icon name="CheckCircle" size={12} />}
            {fmtDate(fl)}
          </span>
        ) : (
          <span className="text-xs text-gray-400 italic">дата не согласована</span>
        )}
        <button
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 transition-opacity flex-shrink-0"
          title="Редактировать"
        >
          <Icon name="Pencil" size={13} />
        </button>
      </div>
    </td>
  );
};

// ────── VacationsTable ───────────────────────────────────────────────────────

const VacationsTable = ({ rows }: { rows: StudentRow[] }) => {
  const [vacMap, setVacMap] = useState<Record<number, StudentVacation | null>>(
    Object.fromEntries(rows.map(s => [s.id, s.vacation ?? null]))
  );

  const handleUpdate = (studentId: number, v: StudentVacation) => {
    setVacMap(prev => ({ ...prev, [studentId]: v }));
  };

  const enriched = rows.map(s => ({ ...s, vacation: vacMap[s.id] ?? s.vacation }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-left">
            <th className="px-3 py-3 font-semibold w-10">№</th>
            <th className="px-3 py-3 font-semibold">Фамилия Имя</th>
            <th className="px-3 py-3 font-semibold">Начало каникул</th>
            <th className="px-3 py-3 font-semibold">Конец каникул</th>
            <th className="px-3 py-3 font-semibold">Первый урок после каникул</th>
          </tr>
        </thead>
        <tbody>
          {enriched.map((s, i) => (
            <tr key={s.id} className="border-t border-gray-100 hover:bg-purple-50/50">
              <td className="px-3 py-3 text-gray-400 align-top">{i + 1}</td>
              <td className="px-3 py-3 font-medium text-gray-900 align-top whitespace-nowrap">
                <NameWithDot name={s.name} statusId={s.status_id} statusName={s.status_name} />
              </td>
              <DateCell
                value={s.vacation?.date_from ?? null}
                placeholder="не указано"
                onSave={async (d) => {
                  const v = s.vacation;
                  await saveVacation(s.id, {
                    date_from: d,
                    date_to: v?.date_to ?? null,
                    vacation_end_type: v?.vacation_end_type ?? 'exact',
                    first_lesson_date: v?.first_lesson_date ?? null,
                    first_lesson_status: v?.first_lesson_status ?? 'not_agreed',
                    note: v?.note ?? '',
                  });
                  handleUpdate(s.id, { ...(v ?? { id: 0, date_to: null, vacation_end_type: 'exact', first_lesson_date: null, first_lesson_status: 'not_agreed', note: '' }), date_from: d });
                }}
              />
              <VacationCell s={s} onUpdate={handleUpdate} />
              <FirstLessonCell s={s} onUpdate={handleUpdate} />
            </tr>
          ))}
          {enriched.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                Нет учеников на каникулах
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default VacationsTable;