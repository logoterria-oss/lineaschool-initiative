import { useEffect, useState } from 'react';
import {
  Lead,
  LeadSlot,
  fetchLeads,
  syncLeadFunnel,
  createLead,
  updateLead,
  moveLead,
  updateLeadRules,
  defaultLeadStatus,
  CLOSING_STATUSES,
  type LeadUpdateResult,
  setLeadArchived,
  NO_CONTACT_FINAL,
  WINDOW_STAGE,
  toLocalInput,
  STUCK_STAGES,
  hasStuckFlow,
} from '@/lib/leadsApi';
import { EMPTY } from './leadUtils';

// Список лидов: загрузка, автообновление и все действия с лидом.
export default function useLeadsData() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Ответ сервера после автоправил: статус лида и архив могли смениться сами.
  const applyResult = (id: number, r: LeadUpdateResult | null) => {
    if (!r) return;
    setLeads((prev) => prev.map((l) => (l.id === id ? {
      ...l,
      ...(r.status_changed_at ? { status_changed_at: r.status_changed_at } : {}),
      ...(r.lead_status != null ? { lead_status: r.lead_status } : {}),
      ...(r.archived != null ? { archived: r.archived, archived_at: r.archived_at ?? null } : {}),
    } : l)));
  };

  const moveToStatus = async (id: number, status: string) => {
    const now = new Date().toISOString();
    setLeads((prev) => prev.map((l) => (l.id === id ? {
      ...l, processing_status: status, status_changed_at: now,
      lead_status: defaultLeadStatus(status, l.lead_status || ''),
    } : l)));
    applyResult(id, await moveLead(id, status));
  };

  // Ручная смена статуса лида. Закрывающие статусы (отказ, игнор и т.п.) отправляют лида в архив.
  const setLeadStatus = async (id: number, status: string) => {
    const closing = CLOSING_STATUSES.includes(status);
    const now = new Date().toISOString();
    setLeads((prev) => prev.map((l) => (l.id === id ? {
      ...l, lead_status: status, ...(closing ? { archived: true, archived_at: now } : {}),
    } : l)));
    applyResult(id, await updateLeadRules(id, { lead_status: status }));
  };

  // Этап дозвона. Последний — «лид не вышел на связь»: ставим этот статус лида и убираем в архив.
  const setStage = async (id: number, stage: string) => {
    if (STUCK_STAGES.includes(stage) || (stage === '' && hasStuckFlow(leads.find((l) => l.id === id) || {}))) {
      const lead = leads.find((l) => l.id === id);
      const dates: Record<string, string> = {};
      const old = lead?.stuck_stage_dates || {};
      STUCK_STAGES.slice(0, STUCK_STAGES.indexOf(stage) + 1).forEach((s) => {
        dates[s] = old[s] || toLocalInput(new Date());
      });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stuck_stage: stage, stuck_stage_dates: dates } : l)));
      updateLead(id, { stuck_stage: stage, stuck_stage_dates: dates });
      return;
    }
    if (stage === NO_CONTACT_FINAL) {
      const now = new Date().toISOString();
      const lead = leads.find((l) => l.id === id);
      const dates = { ...(lead?.no_contact_stage_dates || {}), [stage]: toLocalInput(new Date()) };
      setLeads((prev) => prev.map((l) => (l.id === id
        ? { ...l, no_contact_stage: stage, no_contact_stage_dates: dates, lead_status: NO_CONTACT_FINAL, archived: true, archived_at: now }
        : l)));
      await updateLead(id, { no_contact_stage: stage, no_contact_stage_dates: dates, lead_status: NO_CONTACT_FINAL });
      await setLeadArchived(id, true);
      return;
    }
    const lead = leads.find((l) => l.id === id);
    const dates = { ...(lead?.no_contact_stage_dates || {}) };
    // Новому этапу сразу ставим «сейчас» — время можно поправить вручную
    if (stage && stage !== WINDOW_STAGE && !dates[stage]) dates[stage] = toLocalInput(new Date());
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, no_contact_stage: stage, no_contact_stage_dates: dates } : l)));
    updateLead(id, { no_contact_stage: stage, no_contact_stage_dates: dates });
  };

  const setStageDate = (id: number, stage: string, value: string) => {
    if (STUCK_STAGES.includes(stage)) {
      if (!value) return;
      const lead = leads.find((l) => l.id === id);
      const dates = { ...(lead?.stuck_stage_dates || {}), [stage]: value };
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stuck_stage_dates: dates } : l)));
      updateLead(id, { stuck_stage_dates: dates });
      return;
    }
    const lead = leads.find((l) => l.id === id);
    const dates = { ...(lead?.no_contact_stage_dates || {}), [stage]: value };
    if (!value) delete dates[stage];
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, no_contact_stage_dates: dates } : l)));
    updateLead(id, { no_contact_stage_dates: dates });
  };

  const archiveLead = async (id: number, archived: boolean) => {
    const now = archived ? new Date().toISOString() : null;
    setLeads((prev) => prev.map((l) => (l.id === id ? {
      ...l, archived, archived_at: now,
      ...(!archived && CLOSING_STATUSES.includes(l.lead_status || '') ? { lead_status: '' } : {}),
    } : l)));
    await setLeadArchived(id, archived);
    if (!archived) fetchLeads().then(setLeads);
  };

  const load = async () => {
    setLoading(true);
    setLeads(await fetchLeads());
    setLoading(false);
  };

  useEffect(() => {
    load();
    syncLeadFunnel().then((n) => {
      if (n > 0) fetchLeads().then(setLeads);
    });
  }, []);

  // Вкладку держат открытой днями — подтягиваем новые заявки сами:
  // при возвращении на вкладку и раз в 2 минуты, пока она на экране.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      fetchLeads().then((list) => {
        if (list.length) setLeads(list);
      });
    };
    const timer = window.setInterval(refresh, 120000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const patch = (id: number, key: keyof Lead, value: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, [key]: value } : l)));
  };

  const setSpecial = (id: number, value: string) => {
    patch(id, 'special_condition', value);
    updateLead(id, { special_condition: value });
  };

  const setSlots = (id: number, slots: LeadSlot[]) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, special_slots: slots } : l)));
    updateLead(id, { special_slots: slots });
  };

  const save = (id: number, key: keyof Lead, value: string) => {
    if (key === 'processing_status') {
      moveToStatus(id, value);
      return;
    }
    if (key === 'lead_status') {
      setLeadStatus(id, value);
      return;
    }
    updateLead(id, { [key]: value });
  };

  const addLead = async () => {
    const id = await createLead(EMPTY);
    if (id) load();
  };

  return {
    leads,
    loading,
    load,
    moveToStatus,
    setLeadStatus,
    setStage,
    setStageDate,
    archiveLead,
    patch,
    setSpecial,
    setSlots,
    save,
    addLead,
  };
}
