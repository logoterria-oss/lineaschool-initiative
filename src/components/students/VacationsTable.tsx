import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  StudentRow,
  StudentVacation,
  VacationEndType,
  Admin,
  saveVacation,
  fetchAdmins,
} from '@/lib/studentsApi';
import { NameWithDot, fmtDate } from './studentsTableHelpers';
import CommentsCell from './CommentsCell';

// ────── helpers ──────────────────────────────────────────────────────────────

// Родительный падеж: «с середины июля», «с конца августа».
const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

// Часть месяца по числу: 0 — начало (1–10), 1 — середина (11–20), 2 — конец (21–31).
const partOfMonth = (day: number): 0 | 1 | 2 => (day <= 10 ? 0 : day <= 20 ? 1 : 2);

const PART_WORD = ['с начала', 'с середины', 'с конца'];

// Индекс возвращения: чем раньше — тем меньше. Месяц * 3 + часть месяца.
const returnIndex = (v: StudentVacation | null): number => {
  if (!v || !v.date_to) return Number.MAX_SAFE_INTEGER;
  const d = new Date(v.date_to);
  let part: 0 | 1 | 2;
  if (v.vacation_end_type === 'start_month') part = 0;
  else if (v.vacation_end_type === 'mid_month') part = 1;
  else if (v.vacation_end_type === 'end_month') part = 2;
  else part = partOfMonth(d.getDate());
  return (d.getFullYear() * 12 + d.getMonth()) * 3 + part;
};

// Часть месяца выбранной даты возврата (0/1/2) — независимо от типа.
const returnPart = (v: StudentVacation): 0 | 1 | 2 => {
  if (v.vacation_end_type === 'start_month') return 0;
  if (v.vacation_end_type === 'mid_month') return 1;
  if (v.vacation_end_type === 'end_month') return 2;
  return partOfMonth(new Date(v.date_to as string).getDate());
};

// HSV → hex (s,v в 0..1, h в градусах).
const hsvToHex = (h: number, s: number, val: number): string => {
  const c = val * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = val - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
};

// Цвет по цветовому кругу (36 меток = 12 месяцев × 3 части). Шаг −10° на часть месяца.
// Сезоны ложатся по кругу: весна (март..) — зелёные, лето — жёлто-красные,
// осень — красно-розово-фиолетовые, зима — голубой/синий.
// Опорная точка: начало марта (month=2, part=0) → hue 120° (чистый зелёный).
const returnColor = (v: StudentVacation | null): { bg: string; text: string } | null => {
  if (!v || !v.date_to) return null;
  const d = new Date(v.date_to);
  const monthsFromMarch = d.getMonth() - 2; // март = 0
  const part = returnPart(v);
  let hue = 120 - 30 * monthsFromMarch - 10 * part;
  hue = ((hue % 360) + 360) % 360;
  const bg = hsvToHex(hue, 1, 1);
  // Тёмный текст на жёлто-зелёно-циановых тонах, белый — на остальных.
  const yellowish = hue >= 40 && hue <= 200;
  return { bg, text: yellowish ? '#1f2937' : '#ffffff' };
};

const formatVacationEnd = (v: StudentVacation): string => {
  if (!v.date_to) return '—';
  const d = new Date(v.date_to);
  const yearSuffix = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '';
  if (v.vacation_end_type === 'start_month')
    return `с начала ${MONTHS_GEN[d.getMonth()]}${yearSuffix}`;
  if (v.vacation_end_type === 'mid_month')
    return `с середины ${MONTHS_GEN[d.getMonth()]}${yearSuffix}`;
  if (v.vacation_end_type === 'end_month')
    return `с конца ${MONTHS_GEN[d.getMonth()]}${yearSuffix}`;
  // Конкретная дата: показываем дату + подсказку части месяца.
  return `${fmtDate(v.date_to)} (${PART_WORD[partOfMonth(d.getDate())]})`;
};

// ────── VacationEndEditor ────────────────────────────────────────────────────

const MONTHS_SELECT = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
];

// Режим: exact (конкретная дата) | approx (ориентировочная: месяц + часть месяца)
type EndMode = 'exact' | 'approx';

const VacationEndEditor = ({
  studentId,
  initial,
  onSaved,
  onCancel,
}: {
  studentId: number;
  initial: StudentVacation | null;
  onSaved: (v: StudentVacation) => void;
  onCancel: () => void;
}) => {
  const today = new Date();
  const approxTypes: VacationEndType[] = ['start_month', 'mid_month', 'end_month'];
  const initApprox = !!initial && approxTypes.includes(initial.vacation_end_type);
  const initDate = initial?.date_to ? new Date(initial.date_to) : null;

  const [mode, setMode] = useState<EndMode>(initApprox ? 'approx' : 'exact');
  const [exactDate, setExactDate] = useState(!initApprox && initial?.date_to ? initial.date_to : '');
  const [month, setMonth] = useState<number>(initDate ? initDate.getMonth() : today.getMonth());
  const [year, setYear] = useState<number>(initDate ? initDate.getFullYear() : today.getFullYear());
  const [part, setPart] = useState<VacationEndType>(
    initApprox ? (initial!.vacation_end_type as VacationEndType) : 'start_month',
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      let date_to: string | null;
      let vacation_end_type: VacationEndType;
      if (mode === 'exact') {
        date_to = exactDate || null;
        vacation_end_type = 'exact';
      } else {
        // Храним первое число выбранного месяца, тип = mid/end.
        const mm = String(month + 1).padStart(2, '0');
        date_to = `${year}-${mm}-01`;
        vacation_end_type = part;
      }
      const merged: Partial<Omit<StudentVacation, 'id'>> = {
        date_from: initial?.date_from ?? null,
        date_to,
        vacation_end_type,
        first_lesson_date: initial?.first_lesson_date ?? null,
        first_lesson_status: initial?.first_lesson_status ?? 'not_agreed',
        note: initial?.note ?? '',
      };
      await saveVacation(studentId, merged);
      onSaved({ id: initial?.id ?? 0, ...merged } as StudentVacation);
    } finally {
      setSaving(false);
    }
  };

  const years = [today.getFullYear(), today.getFullYear() + 1];

  return (
    <div className="space-y-2">
      {/* Тип конца каникул */}
      <div className="flex items-center gap-3 text-xs">
        <label className="inline-flex items-center gap-1 cursor-pointer">
          <input type="radio" checked={mode === 'exact'} onChange={() => setMode('exact')} />
          Конкретная дата
        </label>
        <label className="inline-flex items-center gap-1 cursor-pointer">
          <input type="radio" checked={mode === 'approx'} onChange={() => setMode('approx')} />
          Ориентировочная дата
        </label>
      </div>

      {mode === 'exact' ? (
        <Input
          type="date"
          value={exactDate}
          onChange={e => setExactDate(e.target.value)}
          className="h-8 text-xs w-36"
        />
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={part}
            onChange={e => setPart(e.target.value as VacationEndType)}
            className="h-8 px-2 rounded border border-gray-200 text-xs"
          >
            <option value="start_month">С начала</option>
            <option value="mid_month">С середины</option>
            <option value="end_month">С конца</option>
          </select>
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="h-8 px-2 rounded border border-gray-200 text-xs"
          >
            {MONTHS_SELECT.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="h-8 px-2 rounded border border-gray-200 text-xs"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving} className="h-7 text-xs">
          {saving ? '…' : 'ОК'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="h-7 text-xs">Отмена</Button>
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

  const clear = async () => {
    setSaving(true);
    try {
      await onSave(null);
      setDisplayed(null);
      setDraft('');
    } finally {
      setSaving(false);
    }
  };

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
        {displayed && (
          <button
            onClick={clear}
            disabled={saving}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity flex-shrink-0"
            title="Удалить дату"
          >
            <Icon name="Trash2" size={13} />
          </button>
        )}
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
  const [displayed, setDisplayed] = useState<StudentVacation | null>(s.vacation);

  if (editing) {
    return (
      <td className="px-3 py-3 align-top" colSpan={1}>
        <VacationEndEditor
          studentId={s.id}
          initial={displayed}
          onSaved={saved => { setDisplayed(saved); onUpdate(s.id, saved); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </td>
    );
  }

  const color = returnColor(displayed);

  const clear = async () => {
    const merged: Omit<StudentVacation, 'id'> = {
      date_from: displayed?.date_from ?? null,
      date_to: null,
      vacation_end_type: 'exact',
      first_lesson_date: displayed?.first_lesson_date ?? null,
      first_lesson_status: displayed?.first_lesson_status ?? 'not_agreed',
      note: displayed?.note ?? '',
    };
    await saveVacation(s.id, merged);
    const saved = { id: displayed?.id ?? 0, ...merged } as StudentVacation;
    setDisplayed(saved);
    onUpdate(s.id, saved);
  };

  return (
    <td className="px-3 py-3 align-top text-sm text-gray-700 group">
      <div className="flex items-start gap-2">
        {displayed && displayed.date_to ? (
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
            style={color ? { backgroundColor: color.bg, color: color.text } : undefined}
          >
            {formatVacationEnd(displayed)}
          </span>
        ) : (
          <span className="text-gray-400 text-xs italic">не указано</span>
        )}
        <button
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 transition-opacity flex-shrink-0 mt-0.5"
          title="Редактировать"
        >
          <Icon name="Pencil" size={13} />
        </button>
        {displayed && displayed.date_to && (
          <button
            onClick={clear}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity flex-shrink-0 mt-0.5"
            title="Удалить дату"
          >
            <Icon name="Trash2" size={13} />
          </button>
        )}
      </div>
    </td>
  );
};

// ────── VacationsTable ───────────────────────────────────────────────────────

const VacationsTable = ({ rows }: { rows: StudentRow[] }) => {
  const [vacMap, setVacMap] = useState<Record<number, StudentVacation | null>>(
    Object.fromEntries(rows.map(s => [s.id, s.vacation ?? null]))
  );
  const [admins, setAdmins] = useState<Admin[]>([]);

  useEffect(() => {
    fetchAdmins().then(setAdmins).catch(() => setAdmins([]));
  }, []);

  const handleUpdate = (studentId: number, v: StudentVacation) => {
    setVacMap(prev => ({ ...prev, [studentId]: v }));
  };

  const enriched = rows
    .map(s => ({ ...s, vacation: vacMap[s.id] ?? s.vacation }))
    .sort((a, b) => {
      const ra = returnIndex(a.vacation);
      const rb = returnIndex(b.vacation);
      if (ra !== rb) return ra - rb;
      return (a.name || '').localeCompare(b.name || '', 'ru');
    });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-left">
            <th className="px-3 py-3 font-semibold w-10">№</th>
            <th className="px-3 py-3 font-semibold">Фамилия Имя</th>
            <th className="px-3 py-3 font-semibold">Начало каникул</th>
            <th className="px-3 py-3 font-semibold">Вернутся к занятиям</th>
            <th className="px-3 py-3 font-semibold">Комментарии</th>
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
              <CommentsCell studentId={s.id} initial={s.comments || []} admins={admins} />
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