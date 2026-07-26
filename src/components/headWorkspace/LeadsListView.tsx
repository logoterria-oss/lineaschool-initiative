import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  Lead,
  LeadsStats,
  fetchLeads,
  fetchLeadsStats,
  createLead,
  updateLead,
  deleteLead,
  RESPONSIBLE_OPTIONS,
  PROCESSING_OPTIONS,
  LEAD_STATUS_OPTIONS,
} from '@/lib/leadsApi';
import { processingColor, leadStatusColor } from './leads/leadColors';
import LeadsStatsPanel from './leads/LeadsStatsPanel';

const EMPTY: Partial<Lead> = {
  parent_name: '', student_name: '', student_age: '', contact: '',
  request_date: '', responsible: '', processing_status: '', lead_status: '',
  diag_date: '', report_link: '', schedule: '', teachers: '', comment: '',
};

// Лид считается "новым/необработанным" (подсветить красным),
// если по нему ещё не было взаимодействий: не назначен ответственный,
// не выставлен статус обработки и статус лида.
function isUntouched(l: Lead): boolean {
  return !l.responsible?.trim() && !l.processing_status?.trim() && !l.lead_status?.trim();
}

const COLS: { key: keyof Lead; label: string; w: string }[] = [
  { key: 'parent_name', label: 'ФИ родителя', w: 'min-w-[150px]' },
  { key: 'student_name', label: 'ФИ ученика', w: 'min-w-[150px]' },
  { key: 'student_age', label: 'Возраст', w: 'w-16' },
  { key: 'contact', label: 'Номер для связи', w: 'min-w-[170px]' },
  { key: 'request_date', label: 'Дата заявки', w: 'w-24' },
  { key: 'responsible', label: 'Ответственный', w: 'min-w-[170px]' },
  { key: 'processing_status', label: 'Статус обработки', w: 'min-w-[230px]' },
  { key: 'lead_status', label: 'Статус лида', w: 'min-w-[170px]' },
  { key: 'diag_date', label: 'Дата диаг.', w: 'w-24' },
  { key: 'report_link', label: 'Ссылка на закл.', w: 'min-w-[180px]' },
  { key: 'schedule', label: 'Расписание', w: 'min-w-[160px]' },
  { key: 'teachers', label: 'Педагоги', w: 'min-w-[140px]' },
  { key: 'comment', label: 'Комментарий', w: 'min-w-[240px]' },
];

export default function LeadsListView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LeadsStats | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const [tableWidth, setTableWidth] = useState(0);

  // Ширина внутренней «пустышки» верхней полосы = реальной ширине таблицы,
  // чтобы горизонтальный ползунок сверху совпадал с прокруткой таблицы.
  useEffect(() => {
    const el = scrollRef.current?.querySelector('table');
    if (el) setTableWidth(el.scrollWidth);
  }, [leads]);

  const syncFromTop = () => {
    if (scrollRef.current && topBarRef.current) {
      scrollRef.current.scrollLeft = topBarRef.current.scrollLeft;
    }
  };
  const syncFromTable = () => {
    if (scrollRef.current && topBarRef.current) {
      topBarRef.current.scrollLeft = scrollRef.current.scrollLeft;
    }
  };

  const load = async () => {
    setLoading(true);
    setLeads(await fetchLeads());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const collectStats = async (from = dateFrom, to = dateTo) => {
    setStatsOpen(true);
    setStatsLoading(true);
    const s = await fetchLeadsStats(from, to);
    setStats(s);
    setStatsLoading(false);
  };

  const applyPeriod = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    collectStats(from, to);
  };

  const patch = (id: number, key: keyof Lead, value: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, [key]: value } : l)));
  };

  const save = (id: number, key: keyof Lead, value: string) => {
    updateLead(id, { [key]: value });
  };

  const addLead = async () => {
    const id = await createLead(EMPTY);
    if (id) load();
  };

  const removeLead = async (id: number) => {
    if (!confirm('Удалить этого лида?')) return;
    if (await deleteLead(id)) setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={() => collectStats()}
          disabled={statsLoading}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors disabled:opacity-60"
        >
          <Icon name={statsLoading ? 'Loader2' : 'BarChart3'} size={18} className={statsLoading ? 'animate-spin' : ''} />
          Собрать статистику
        </button>
        <button
          onClick={addLead}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Icon name="Plus" size={18} />
          Добавить лида
        </button>
        <button
          onClick={load}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Icon name="RefreshCw" size={16} />
          Обновить
        </button>
        <div className="text-sm text-gray-400 ml-auto flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
          новый необработанный лид
        </div>
      </div>

      {statsOpen && (
        <LeadsStatsPanel
          stats={stats}
          loading={statsLoading}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChangeFrom={setDateFrom}
          onChangeTo={setDateTo}
          onApply={() => collectStats()}
          onPreset={applyPeriod}
          onClose={() => setStatsOpen(false)}
        />
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400">
          <Icon name="Loader2" size={28} className="animate-spin mx-auto mb-2" />
          Загрузка лидов…
        </div>
      ) : leads.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Icon name="Inbox" size={36} className="mx-auto mb-2" />
          <p className="font-medium text-gray-500">Пока нет лидов</p>
          <p className="text-sm">Новые заявки с сайта появятся здесь автоматически</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Верхняя полоса горизонтальной прокрутки — сразу под шапкой действий */}
          <div
            ref={topBarRef}
            onScroll={syncFromTop}
            className="overflow-x-auto overflow-y-hidden"
          >
            <div style={{ width: tableWidth, height: 1 }} />
          </div>
          <div
            ref={scrollRef}
            onScroll={syncFromTable}
            className="overflow-x-auto overflow-y-auto max-h-[65vh]"
          >
          <table className="min-w-full text-sm border-collapse">
            <thead className="sticky top-0 z-30">
              <tr className="bg-yellow-100">
                <th className="px-2 py-2 text-left font-bold text-gray-700 border-b border-gray-200 w-10 bg-yellow-100 sticky top-0 z-30">№</th>
                {COLS.map((c, ci) => (
                  <th
                    key={c.key}
                    className={`px-2 py-2 text-left font-bold text-gray-700 border-b border-gray-200 bg-yellow-100 sticky top-0 z-30 ${ci === 1 ? 'left-0 z-40 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]' : ''} ${c.w}`}
                  >
                    {c.label}
                  </th>
                ))}
                <th className="px-2 py-2 border-b border-gray-200 w-10 bg-yellow-100 sticky top-0" />
              </tr>
            </thead>
            <tbody>
              {leads.map((_, idx, arr) => arr[arr.length - 1 - idx]).map((l, idx) => {
                const untouched = isUntouched(l);
                const displayIdx = leads.length - idx;
                const rowBg = untouched ? 'bg-red-50' : idx % 2 ? 'bg-gray-100' : 'bg-white';
                return (
                  <tr key={l.id} className={untouched ? 'bg-red-50' : idx % 2 ? 'bg-gray-50/50' : 'bg-white'}>
                    <td className="px-2 py-1.5 text-gray-400 border-b border-gray-100 align-top">{displayIdx}</td>
                    {COLS.map((c, ci) => (
                      <td
                        key={c.key}
                        className={`px-1 py-1 border-b border-gray-100 align-top ${ci === 1 ? `sticky left-0 z-10 ${rowBg} shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]` : ''}`}
                      >
                        <Cell
                          lead={l}
                          fieldKey={c.key}
                          onChange={(v) => patch(l.id, c.key, v)}
                          onCommit={(v) => save(l.id, c.key, v)}
                        />
                      </td>
                    ))}
                    <td className="px-1 py-1 border-b border-gray-100 align-top text-center">
                      <button onClick={() => removeLead(l.id)} className="text-gray-300 hover:text-red-500">
                        <Icon name="Trash2" size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface CellProps {
  lead: Lead;
  fieldKey: keyof Lead;
  onChange: (v: string) => void;
  onCommit: (v: string) => void;
}

function Cell({ lead, fieldKey, onChange, onCommit }: CellProps) {
  const value = (lead[fieldKey] as string) || '';

  if (fieldKey === 'responsible') {
    return (
      <TagSelect value={value} options={RESPONSIBLE_OPTIONS} colorClass="bg-purple-100 text-purple-800"
        onCommit={(v) => { onChange(v); onCommit(v); }} />
    );
  }
  if (fieldKey === 'processing_status') {
    return (
      <TagSelect value={value} options={PROCESSING_OPTIONS} colorClass={processingColor(value)}
        onCommit={(v) => { onChange(v); onCommit(v); }} />
    );
  }
  if (fieldKey === 'lead_status') {
    return (
      <TagSelect value={value} options={LEAD_STATUS_OPTIONS} colorClass={leadStatusColor(value)}
        onCommit={(v) => { onChange(v); onCommit(v); }} />
    );
  }
  if (fieldKey === 'report_link' && value) {
    return (
      <div className="flex items-center gap-1">
        <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[150px] text-xs">
          {value.replace(/^https?:\/\//, '')}
        </a>
        <EditText value={value} multiline={false} onChange={onChange} onCommit={onCommit} iconOnly />
      </div>
    );
  }
  const multiline = fieldKey === 'comment';
  return <EditText value={value} multiline={multiline} onChange={onChange} onCommit={onCommit} />;
}

function TagSelect({ value, options, colorClass, onCommit }: {
  value: string; options: string[]; colorClass: string; onCommit: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${value ? colorClass : 'bg-gray-50 text-gray-400 border border-dashed border-gray-300'}`}
      >
        {value || '—'}
        <Icon name="ChevronDown" size={12} className="opacity-60" />
      </span>
      <select
        value={value}
        onChange={(e) => onCommit(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function EditText({ value, multiline, onChange, onCommit, iconOnly }: {
  value: string; multiline: boolean; onChange: (v: string) => void; onCommit: (v: string) => void; iconOnly?: boolean;
}) {
  if (iconOnly) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onCommit(e.target.value)}
        className="w-3 opacity-0 focus:opacity-100 focus:w-40 focus:absolute focus:z-10 focus:bg-white focus:border focus:border-amber-300 focus:rounded focus:px-1 focus:py-0.5 text-xs"
      />
    );
  }
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onCommit(e.target.value)}
        rows={2}
        className="w-full resize-y bg-transparent hover:bg-amber-50 focus:bg-white focus:border focus:border-amber-300 rounded px-1 py-0.5 text-xs outline-none"
      />
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onCommit(e.target.value)}
      className="w-full bg-transparent hover:bg-amber-50 focus:bg-white focus:border focus:border-amber-300 rounded px-1 py-0.5 text-xs outline-none"
    />
  );
}