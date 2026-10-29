import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Lead, fetchLeads } from '@/lib/leadsApi';
import { moscowToday } from '@/lib/adminShiftsApi';
import { MarkState } from '@/components/adminShifts/useShiftChecklist';
import { DashLead, LeadGroup, buildLeadGroups } from './leadsToContact';

const EMPTY: Record<string, string> = {
  new: 'Новых лидов нет',
  diag: 'Неоплаченных диагностик на завтра нет',
  lessons: 'Неоплаченных занятий в ближайшие 2 дня нет',
  contact: 'Дозваниваться никому не нужно',
  stuck: 'Зависших лидов нет',
};

const fmtDue = (d: Date, now: Date) => {
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (d.getTime() <= now.getTime()) return { text: 'пора', late: true };
  if (d.toDateString() === now.toDateString()) return { text: `с ${time}`, late: false };
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) {
    return { text: d.getHours() === 0 ? 'завтра' : `завтра с ${time}`, late: false };
  }
  return { text: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }), late: false };
};

/** Ключ отметки: у дозвона — свой на каждый шаг, чтобы следующий звонок снова был не отмечен */
const markKey = (g: LeadGroup, i: DashLead) =>
  `lead:${g.key}:${i.lead.id}${g.key === 'contact' ? `:${i.lead.no_contact_stage || 'start'}` : ''}`;

interface Props {
  marks: Record<string, MarkState>;
  onMark: (key: string, p: MarkState) => void;
  onCount?: (open: number) => void;
}

/** Лиды, с которыми нужно связаться — в том же виде, что пункты «Расписание и занятия» */
const LeadsToContactBlock = ({ marks, onMark, onCount }: Props) => {
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
  const isDone = (g: LeadGroup) => g.items.every((i) => marks[markKey(g, i)]?.done);
  const doneCount = groups.filter(isDone).length;

  useEffect(() => {
    if (leads) onCount?.(doneCount);
  }, [leads, doneCount, onCount]);

  if (!leads) {
    return (
      <div className="text-sm text-gray-400 flex items-center gap-2">
        <Icon name="Loader2" size={14} className="animate-spin" /> Загружаем лиды…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map((g, gi) => {
        const done = isDone(g);
        return (
          <div
            key={g.key}
            className={`rounded-xl border px-3 py-2.5 transition-colors ${
              done ? 'border-green-200 bg-green-50/60' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`mt-0.5 shrink-0 ${done ? 'text-green-600' : 'text-gray-300'}`}>
                <Icon name={done ? 'CircleCheck' : 'Circle'} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`flex items-start gap-1.5 text-sm leading-snug ${done ? 'text-gray-500' : 'text-gray-900'}`}>
                  <span className="flex-1">
                    <span className="text-gray-400 mr-1.5">{gi + 1}.</span>
                    {g.title}
                  </span>
                  {g.items.length > 0 && (
                    <span className="shrink-0 text-[10px] font-medium bg-amber-100 text-amber-700 rounded px-1.5 py-0.5">
                      {g.items.length}
                    </span>
                  )}
                </div>

                {g.items.length === 0 ? (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-green-600">
                    <Icon name="Check" size={13} />
                    <span className="text-gray-400">{EMPTY[g.key]}</span>
                  </div>
                ) : (
                  <div className="mt-2 space-y-1">
                    {g.items.map((i) => {
                      const key = markKey(g, i);
                      const m = marks[key] || { done: false, comment: '' };
                      const l = i.lead;
                      const name = l.parent_name || l.student_name || `Лид №${l.id}`;
                      const due = i.due ? fmtDue(i.due, now) : null;
                      const note = [l.student_name && l.parent_name ? l.student_name : '', i.hint, l.contact]
                        .filter(Boolean)
                        .join(' · ');
                      return (
                        <div
                          key={key}
                          onClick={() => onMark(key, { done: !m.done, comment: m.comment })}
                          className={`w-full flex items-start gap-2 text-left rounded-md border px-2 py-1.5 cursor-pointer transition-colors ${
                            m.done
                              ? 'border-green-200 bg-green-50 text-gray-400'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <Icon
                            name={m.done ? 'SquareCheck' : 'Square'}
                            size={15}
                            className={`mt-px shrink-0 ${m.done ? 'text-green-600' : 'text-gray-300'}`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className={`block text-[12px] leading-snug ${m.done ? 'line-through' : 'text-gray-900'}`}>
                              {name}
                            </span>
                            <span className="block text-[10.5px] text-gray-400 mt-px">{note}</span>
                            {m.done && m.by && (
                              <span className="block text-[10.5px] text-green-700 mt-px">
                                отметил(а) {m.by}
                                {m.at ? ` в ${m.at}` : ''}
                              </span>
                            )}
                          </span>
                          {due && !m.done && (
                            <span
                              className={`shrink-0 text-[10px] font-medium rounded px-1.5 py-0.5 ${
                                due.late ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {due.text}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LeadsToContactBlock;
