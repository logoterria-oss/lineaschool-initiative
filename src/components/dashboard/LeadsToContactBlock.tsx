import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Lead, fetchLeads } from '@/lib/leadsApi';
import { moscowToday } from '@/lib/adminShiftsApi';
import { DashLead, buildLeadGroups } from './leadsToContact';

const fmtDue = (d: Date, now: Date) => {
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (d.getTime() <= now.getTime()) return { text: 'пора', late: true };
  if (sameDay) return { text: `с ${time}`, late: false };
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) {
    return { text: d.getHours() === 0 ? 'завтра' : `завтра с ${time}`, late: false };
  }
  return { text: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }), late: false };
};

const LeadRow = ({ item, now }: { item: DashLead; now: Date }) => {
  const { lead, hint, due } = item;
  const d = due ? fmtDue(due, now) : null;
  const name = lead.parent_name || lead.student_name || `Лид №${lead.id}`;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {name}
          {lead.student_name && lead.parent_name && (
            <span className="font-normal text-gray-500"> · {lead.student_name}</span>
          )}
        </div>
        <div className="text-xs text-gray-600 mt-0.5">{hint}</div>
        {lead.contact && <div className="text-xs text-gray-400 mt-0.5 truncate">{lead.contact}</div>}
      </div>
      {d && (
        <span
          className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${
            d.late ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {d.text}
        </span>
      )}
    </div>
  );
};

/** Лиды, с которыми нужно связаться: новые, неоплаченные диагностики и занятия, дозвон, зависшие */
const LeadsToContactBlock = ({ onCount }: { onCount?: (n: number) => void }) => {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(() => {
    fetchLeads().then((list) => {
      setLeads(list);
      setNow(new Date());
    });
  }, []);

  useEffect(() => {
    load();
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 5 * 60000);
    return () => window.clearInterval(t);
  }, [load]);

  const groups = useMemo(() => (leads ? buildLeadGroups(leads, moscowToday(), now) : []), [leads, now]);
  const total = groups.reduce((s, g) => s + g.items.length, 0);

  useEffect(() => {
    if (leads) onCount?.(total);
  }, [leads, total, onCount]);

  if (!leads) {
    return (
      <div className="text-sm text-gray-400 flex items-center gap-2">
        <Icon name="Loader2" size={14} className="animate-spin" /> Загружаем лиды…
      </div>
    );
  }
  if (total === 0) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-green-600">
        <Icon name="Check" size={15} /> Сейчас никому звонить и писать не нужно
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.filter((g) => g.items.length > 0).map((g) => (
        <div key={g.key}>
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
            <Icon name={g.icon} size={15} className="text-gray-400" />
            {g.title}
            <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">{g.items.length}</span>
          </div>
          <div className="space-y-1.5">
            {g.items.map((i) => (
              <LeadRow key={i.lead.id} item={i} now={now} />
            ))}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-gray-400">
        Этапы дозвона и статусы отмечаются в карточке лида на доске продаж — после этого лид уйдёт из списка или сдвинется на следующий шаг.
      </p>
    </div>
  );
};

export default LeadsToContactBlock;
