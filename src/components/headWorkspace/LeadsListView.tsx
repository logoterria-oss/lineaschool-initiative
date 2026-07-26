import { useEffect, useMemo, useRef, useState } from 'react';
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

// Дата заявки хранится текстом: «ДД.ММ» или «ДД.ММ.ГГГГ» (иногда через «/»).
// Превращаем в число ГГГГММДД для сортировки. Год берём текущий, если не указан.
// Лиды без даты уходят вниз.
function requestDateSortKey(raw: string | undefined): number {
  const s = (raw || '').trim().replace(/\//g, '.');
  const m = s.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/);
  if (!m) return -1;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  let year = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
  if (year < 100) year += 2000;
  if (!month || !day) return -1;
  return year * 10000 + month * 100 + day;
}

// ISO-дата из input[type=date] («ГГГГ-ММ-ДД») → число ГГГГММДД. Пусто → 0.
function isoToSortKey(iso: string): number {
  const m = (iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 10000 + parseInt(m[2], 10) * 100 + parseInt(m[3], 10);
}

const COLS: { key: keyof Lead; label: string; w: string }[] = [
  { key: 'parent_name', label: 'ФИ родителя', w: 'min-w-[210px]' },
  { key: 'student_name', label: 'ФИ ученика', w: 'min-w-[210px]' },
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

  // Фильтры таблицы (не связаны со статистикой)
  const [fSearch, setFSearch] = useState('');
  const [fResponsible, setFResponsible] = useState('');
  const [fProcessing, setFProcessing] = useState('');
  const [fLeadStatus, setFLeadStatus] = useState('');
  const [fDateFrom, setFDateFrom] = useState('');
  const [fDateTo, setFDateTo] = useState('');
  const [fUntouchedOnly, setFUntouchedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const resetFilters = () => {
    setFSearch('');
    setFResponsible('');
    setFProcessing('');
    setFLeadStatus('');
    setFDateFrom('');
    setFDateTo('');
    setFUntouchedOnly(false);
  };

  const activeFiltersCount =
    (fSearch ? 1 : 0) +
    (fResponsible ? 1 : 0) +
    (fProcessing ? 1 : 0) +
    (fLeadStatus ? 1 : 0) +
    (fDateFrom || fDateTo ? 1 : 0) +
    (fUntouchedOnly ? 1 : 0);
  const hasActiveFilters = activeFiltersCount > 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const [tableWidth, setTableWidth] = useState(0);

  // Сортируем по дате заявки: ближайшие/новые сверху, дальние снизу.
  // При равных датах — новее по id. Лиды без даты уходят в самый низ.
  const sortedLeads = useMemo(
    () =>
      [...leads].sort((a, b) => {
        const ka = requestDateSortKey(a.request_date);
        const kb = requestDateSortKey(b.request_date);
        if (ka !== kb) return kb - ka;
        return b.id - a.id;
      }),
    [leads],
  );

  const visibleLeads = useMemo(() => {
    const q = fSearch.trim().toLowerCase();
    const fromKey = isoToSortKey(fDateFrom);
    const toKey = isoToSortKey(fDateTo);
    return sortedLeads.filter((l) => {
      if (q && !`${l.parent_name} ${l.student_name}`.toLowerCase().includes(q)) return false;
      if (fResponsible && (l.responsible || '') !== fResponsible) return false;
      if (fProcessing && (l.processing_status || '') !== fProcessing) return false;
      if (fLeadStatus && (l.lead_status || '') !== fLeadStatus) return false;
      if (fUntouchedOnly && !isUntouched(l)) return false;
      if (fromKey > 0 || toKey > 0) {
        const k = requestDateSortKey(l.request_date);
        if (k < 0) return false;
        if (fromKey > 0 && k < fromKey) return false;
        if (toKey > 0 && k > toKey) return false;
      }
      return true;
    });
  }, [sortedLeads, fSearch, fResponsible, fProcessing, fLeadStatus, fDateFrom, fDateTo, fUntouchedOnly]);

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
        <button
          onClick={() => setFiltersOpen(true)}
          className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors border ${
            hasActiveFilters
              ? 'bg-amber-50 border-amber-300 text-amber-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Icon name="SlidersHorizontal" size={16} />
          Фильтры
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-amber-500 text-white text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
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

      {!loading && leads.length > 0 && hasActiveFilters && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <Icon name="Filter" size={15} className="text-amber-500" />
          <span>Фильтры применены. Показано: <b className="text-gray-700">{visibleLeads.length}</b> из {leads.length}</span>
          <button onClick={resetFilters} className="text-amber-600 hover:underline">Сбросить</button>
        </div>
      )}

      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Icon name="SlidersHorizontal" size={18} className="text-amber-600" />
                Фильтры
              </h3>
              <button onClick={() => setFiltersOpen(false)} className="text-gray-400 hover:text-gray-700">
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Поиск по ФИО</label>
                <div className="relative">
                  <Icon name="Search" size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={fSearch}
                    onChange={(e) => setFSearch(e.target.value)}
                    placeholder="Родитель или ученик"
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-2.5 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ответственный</label>
                <select
                  value={fResponsible}
                  onChange={(e) => setFResponsible(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-400 bg-white"
                >
                  <option value="">Все</option>
                  {RESPONSIBLE_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Статус обработки</label>
                <select
                  value={fProcessing}
                  onChange={(e) => setFProcessing(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-400 bg-white"
                >
                  <option value="">Все</option>
                  {PROCESSING_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Статус лида</label>
                <select
                  value={fLeadStatus}
                  onChange={(e) => setFLeadStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-400 bg-white"
                >
                  <option value="">Все</option>
                  {LEAD_STATUS_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Дата заявки с</label>
                  <input
                    type="date"
                    value={fDateFrom}
                    onChange={(e) => setFDateFrom(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">по</label>
                  <input
                    type="date"
                    value={fDateTo}
                    onChange={(e) => setFDateTo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fUntouchedOnly}
                  onChange={(e) => setFUntouchedOnly(e.target.checked)}
                  className="w-4 h-4 accent-red-500"
                />
                <span className="text-sm text-gray-700">Только необработанные (новые) лиды</span>
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
              <button
                onClick={resetFilters}
                className="text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                Сбросить всё
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Найдено: {visibleLeads.length}</span>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
                >
                  Показать
                </button>
              </div>
            </div>
          </div>
        </div>
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
      ) : visibleLeads.length === 0 ? (
        <div className="py-16 text-center text-gray-400 border border-gray-200 rounded-xl">
          <Icon name="SearchX" size={36} className="mx-auto mb-2" />
          <p className="font-medium text-gray-500">Ничего не найдено</p>
          <button onClick={resetFilters} className="text-sm text-amber-600 hover:underline mt-1">
            Сбросить фильтры
          </button>
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
            className="overflow-x-hidden overflow-y-auto max-h-[65vh]"
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
                <th className="px-2 py-2 border-b border-gray-200 w-14 pr-6 bg-yellow-100 sticky top-0" />
              </tr>
            </thead>
            <tbody>
              {visibleLeads.map((l, idx) => {
                const untouched = isUntouched(l);
                const displayIdx = idx + 1;
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
                    <td className="px-1 py-1 pr-6 border-b border-gray-100 align-top text-center">
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