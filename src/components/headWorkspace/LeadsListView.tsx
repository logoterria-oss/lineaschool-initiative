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
} from '@/lib/leadsApi';
import LeadsStatsPanel from './leads/LeadsStatsPanel';
import LeadsFilters from './leads/LeadsFilters';
import NewLeadsPanel, { CONTACTED_STATUS } from './leads/NewLeadsPanel';
import LeadCard from './leads/LeadCard';
import { Cell } from './leads/LeadCells';
import {
  EMPTY,
  COLS,
  isUntouched,
  requestDateSortKey,
  isoToSortKey,
  isContactDue,
  isContactOverdue,
} from './leads/leadUtils';

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
  const [fContactDue, setFContactDue] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const resetFilters = () => {
    setFSearch('');
    setFResponsible('');
    setFProcessing('');
    setFLeadStatus('');
    setFDateFrom('');
    setFDateTo('');
    setFUntouchedOnly(false);
    setFContactDue(false);
  };

  const activeFiltersCount =
    (fSearch ? 1 : 0) +
    (fResponsible ? 1 : 0) +
    (fProcessing ? 1 : 0) +
    (fLeadStatus ? 1 : 0) +
    (fDateFrom || fDateTo ? 1 : 0) +
    (fUntouchedOnly ? 1 : 0) +
    (fContactDue ? 1 : 0);
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
      if (fContactDue && !isContactDue(l) && !isContactOverdue(l)) return false;
      if (fromKey > 0 || toKey > 0) {
        const k = requestDateSortKey(l.request_date);
        if (k < 0) return false;
        if (fromKey > 0 && k < fromKey) return false;
        if (toKey > 0 && k > toKey) return false;
      }
      return true;
    });
  }, [sortedLeads, fSearch, fResponsible, fProcessing, fLeadStatus, fDateFrom, fDateTo, fUntouchedOnly, fContactDue]);

  // Новые (необработанные) лиды — сверху, с кнопкой «Списались».
  const newLeads = useMemo(() => sortedLeads.filter(isUntouched), [sortedLeads]);

  const markContacted = async (id: number) => {
    await updateLead(id, { processing_status: CONTACTED_STATUS });
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, processing_status: CONTACTED_STATUS } : l)),
    );
  };

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
      <LeadsFilters
        statsLoading={statsLoading}
        onCollectStats={() => collectStats()}
        onAddLead={addLead}
        onLoad={load}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        hasActiveFilters={hasActiveFilters}
        activeFiltersCount={activeFiltersCount}
        fSearch={fSearch}
        setFSearch={setFSearch}
        fResponsible={fResponsible}
        setFResponsible={setFResponsible}
        fProcessing={fProcessing}
        setFProcessing={setFProcessing}
        fLeadStatus={fLeadStatus}
        setFLeadStatus={setFLeadStatus}
        fDateFrom={fDateFrom}
        setFDateFrom={setFDateFrom}
        fDateTo={fDateTo}
        setFDateTo={setFDateTo}
        fUntouchedOnly={fUntouchedOnly}
        setFUntouchedOnly={setFUntouchedOnly}
        fContactDue={fContactDue}
        setFContactDue={setFContactDue}
        resetFilters={resetFilters}
        visibleCount={visibleLeads.length}
      />

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

      {!loading && <NewLeadsPanel leads={newLeads} onContacted={markContacted} />}

      {!loading && leads.length > 0 && hasActiveFilters && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <Icon name="Filter" size={15} className="text-amber-500" />
          <span>Фильтры применены. Показано: <b className="text-gray-700">{visibleLeads.length}</b> из {leads.length}</span>
          <button onClick={resetFilters} className="text-amber-600 hover:underline">Сбросить</button>
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
        <>
        {/* Мобильный вид — карточки (таблица неудобна на узких экранах) */}
        <div className="md:hidden space-y-3">
          {visibleLeads.map((l, idx) => (
            <LeadCard
              key={l.id}
              lead={l}
              index={idx + 1}
              onPatch={(k, v) => patch(l.id, k, v)}
              onSave={(k, v) => save(l.id, k, v)}
              onRemove={() => removeLead(l.id)}
            />
          ))}
        </div>

        {/* Десктопный вид — таблица */}
        <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden">
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
        </>
      )}
    </div>
  );
}