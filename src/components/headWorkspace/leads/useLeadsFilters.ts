import { useMemo, useState } from 'react';
import { Lead } from '@/lib/leadsApi';
import {
  isUntouched,
  requestDateSortKey,
  isoToSortKey,
  isContactDue,
  isContactOverdue,
} from './leadUtils';

// Фильтры таблицы лидов, сортировка, вид (таблица/колонки) и производные списки.
export default function useLeadsFilters(leads: Lead[]) {
  // Фильтры таблицы (не связаны со статистикой)
  const [fSearch, setFSearch] = useState('');
  const [fResponsible, setFResponsible] = useState('');
  const [fProcessing, setFProcessing] = useState('');
  const [fLeadStatus, setFLeadStatus] = useState('');
  const [fCampaign, setFCampaign] = useState('');
  const [fDateFrom, setFDateFrom] = useState('');
  const [fDateTo, setFDateTo] = useState('');
  const [fUntouchedOnly, setFUntouchedOnly] = useState(false);
  const [fContactDue, setFContactDue] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Вид: таблица или колонки по статусу обработки (запоминаем выбор)
  const [view, setViewState] = useState<'table' | 'board'>(
    () => (localStorage.getItem('leads_view') === 'table' ? 'table' : 'board'),
  );
  const setView = (v: 'table' | 'board') => {
    setViewState(v);
    localStorage.setItem('leads_view', v);
  };

  const resetFilters = () => {
    setFSearch('');
    setFResponsible('');
    setFProcessing('');
    setFLeadStatus('');
    setFCampaign('');
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
    (fCampaign ? 1 : 0) +
    (fDateFrom || fDateTo ? 1 : 0) +
    (fUntouchedOnly ? 1 : 0) +
    (fContactDue ? 1 : 0);
  const hasActiveFilters = activeFiltersCount > 0;

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
      if (fCampaign) {
        const camp = (l.utm_campaign || '').trim();
        if (fCampaign === '__none__' ? camp !== '' : camp !== fCampaign) return false;
      }
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
  }, [sortedLeads, fSearch, fResponsible, fProcessing, fLeadStatus, fCampaign, fDateFrom, fDateTo, fUntouchedOnly, fContactDue]);

  const campaignOptions = useMemo(
    () => Array.from(new Set(leads.map((l) => (l.utm_campaign || '').trim()).filter(Boolean))).sort(),
    [leads],
  );

  // Новые (необработанные) лиды — сверху, с кнопкой «Списались».
  const newLeads = useMemo(() => sortedLeads.filter(isUntouched), [sortedLeads]);

  return {
    fSearch, setFSearch,
    fResponsible, setFResponsible,
    fProcessing, setFProcessing,
    fLeadStatus, setFLeadStatus,
    fCampaign, setFCampaign,
    fDateFrom, setFDateFrom,
    fDateTo, setFDateTo,
    fUntouchedOnly, setFUntouchedOnly,
    fContactDue, setFContactDue,
    filtersOpen, setFiltersOpen,
    view, setView,
    resetFilters,
    activeFiltersCount,
    hasActiveFilters,
    visibleLeads,
    campaignOptions,
    newLeads,
  };
}
