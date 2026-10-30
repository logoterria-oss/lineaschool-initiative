import { RefObject } from 'react';
import Icon from '@/components/ui/icon';
import { Lead, LeadSlot } from '@/lib/leadsApi';
import LeadCard from './LeadCard';
import { Cell } from './LeadCells';
import { COLS, isUntouched } from './leadUtils';

interface Props {
  visibleLeads: Lead[];
  scrollRef: RefObject<HTMLDivElement | null>;
  topBarRef: RefObject<HTMLDivElement | null>;
  tableWidth: number;
  syncFromTop: () => void;
  syncFromTable: () => void;
  patch: (id: number, key: keyof Lead, value: string) => void;
  save: (id: number, key: keyof Lead, value: string) => void;
  archiveLead: (id: number, archived: boolean) => void;
  setStage: (id: number, stage: string) => void;
  setStageDate: (id: number, stage: string, value: string) => void;
  setSpecial: (id: number, value: string) => void;
  setSlots: (id: number, slots: LeadSlot[]) => void;
}

// Вид «таблица»: карточки на мобильных и таблица на десктопе.
export default function LeadsTableView({
  visibleLeads, scrollRef, topBarRef, tableWidth, syncFromTop, syncFromTable,
  patch, save, archiveLead, setStage, setStageDate, setSpecial, setSlots,
}: Props) {
  return (
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
          onArchive={(a) => archiveLead(l.id, a)}
          onStage={(s) => setStage(l.id, s)}
          onStageDate={(s, v) => setStageDate(l.id, s, v)}
          onSpecial={(v) => setSpecial(l.id, v)}
          onSlots={(v) => setSlots(l.id, v)}
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
                      onStage={(s) => setStage(l.id, s)}
                      onStageDate={(s, v) => setStageDate(l.id, s, v)}
                      onSpecial={(v) => setSpecial(l.id, v)}
                      onSlots={(v) => setSlots(l.id, v)}
                    />
                  </td>
                ))}
                <td className="px-1 py-1 pr-6 border-b border-gray-100 align-top text-center">
                  <button onClick={() => archiveLead(l.id, !l.archived)} title={l.archived ? 'Вернуть из архива' : 'В архив'} className="text-gray-300 hover:text-amber-600">
                    <Icon name={l.archived ? 'ArchiveRestore' : 'Archive'} size={15} />
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
  );
}
