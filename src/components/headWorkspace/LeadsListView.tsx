import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { LeadsStats, fetchLeadsStats } from '@/lib/leadsApi';
import LeadsBoard from './leads/LeadsBoard';
import LeadsStatsPanel from './leads/LeadsStatsPanel';
import LeadsFilters from './leads/LeadsFilters';
import NewLeadsPanel from './leads/NewLeadsPanel';
import LeadsTableView from './leads/LeadsTableView';
import useLeadsData from './leads/useLeadsData';
import useLeadsFilters from './leads/useLeadsFilters';

export default function LeadsListView() {
  const {
    leads, loading, load, moveToStatus, setLeadStatus, setStage, setStageDate,
    archiveLead, patch, setSpecial, setSlots, save, addLead,
  } = useLeadsData();
  const [stats, setStats] = useState<LeadsStats | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const f = useLeadsFilters(leads);
  const { visibleLeads, hasActiveFilters, resetFilters, view } = f;

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

  return (
    <div>
      <LeadsFilters
        statsLoading={statsLoading}
        onCollectStats={() => collectStats()}
        onAddLead={addLead}
        onLoad={load}
        filtersOpen={f.filtersOpen}
        setFiltersOpen={f.setFiltersOpen}
        hasActiveFilters={hasActiveFilters}
        activeFiltersCount={f.activeFiltersCount}
        fSearch={f.fSearch}
        setFSearch={f.setFSearch}
        fResponsible={f.fResponsible}
        setFResponsible={f.setFResponsible}
        fProcessing={f.fProcessing}
        setFProcessing={f.setFProcessing}
        fLeadStatus={f.fLeadStatus}
        setFLeadStatus={f.setFLeadStatus}
        fCampaign={f.fCampaign}
        setFCampaign={f.setFCampaign}
        campaignOptions={f.campaignOptions}
        fDateFrom={f.fDateFrom}
        setFDateFrom={f.setFDateFrom}
        fDateTo={f.fDateTo}
        setFDateTo={f.setFDateTo}
        fUntouchedOnly={f.fUntouchedOnly}
        setFUntouchedOnly={f.setFUntouchedOnly}
        fContactDue={f.fContactDue}
        setFContactDue={f.setFContactDue}
        resetFilters={resetFilters}
        visibleCount={visibleLeads.length}
        view={view}
        setView={f.setView}
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

      {!loading && <NewLeadsPanel leads={f.newLeads} />}

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
      ) : view === 'board' ? (
        <LeadsBoard
          leads={visibleLeads}
          onMove={moveToStatus}
          onArchive={archiveLead}
          onLeadStatus={setLeadStatus}
          onStage={setStage}
          onStageDate={setStageDate}
          onSpecial={setSpecial}
          onSlots={setSlots}
          onComment={(id, c) => { patch(id, 'comment', c); save(id, 'comment', c); }}
        />
      ) : (
        <LeadsTableView
          visibleLeads={visibleLeads}
          scrollRef={scrollRef}
          topBarRef={topBarRef}
          tableWidth={tableWidth}
          syncFromTop={syncFromTop}
          syncFromTable={syncFromTable}
          patch={patch}
          save={save}
          archiveLead={archiveLead}
          setStage={setStage}
          setStageDate={setStageDate}
          setSpecial={setSpecial}
          setSlots={setSlots}
        />
      )}
    </div>
  );
}
