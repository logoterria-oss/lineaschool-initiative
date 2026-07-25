import Icon from '@/components/ui/icon';
import { DialogItem } from '@/lib/interactionsApi';
import { CrmBadge, fmtTime } from './interactionShared';

interface DialogListProps {
  search: string;
  setSearch: (v: string) => void;
  openNew: () => void;
  onlyMine: boolean;
  setOnlyMine: (v: boolean) => void;
  mineCount: number;
  loading: boolean;
  filtered: DialogItem[];
  activeId: number | null;
  setActiveId: (id: number) => void;
  isMine: (d: DialogItem) => boolean;
}

const DialogList = ({
  search,
  setSearch,
  openNew,
  onlyMine,
  setOnlyMine,
  mineCount,
  loading,
  filtered,
  activeId,
  setActiveId,
  isMine,
}: DialogListProps) => {
  return (
    <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени или телефону"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-green-400"
            />
          </div>
          <button
            onClick={openNew}
            title="Новый диалог из CRM"
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Icon name="Plus" size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setOnlyMine(false)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${!onlyMine ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Все чаты
          </button>
          <button
            onClick={() => setOnlyMine(true)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${onlyMine ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Только мои{mineCount > 0 ? ` · ${mineCount}` : ''}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && <div className="p-4 text-sm text-gray-400 text-center">Загрузка…</div>}
        {!loading && filtered.length === 0 && (
          <div className="p-6 text-sm text-gray-400 text-center">
            {onlyMine
              ? 'На вас пока не назначено ни одного диалога.'
              : 'Пока нет диалогов. Как только клиент напишет в Max, чат появится здесь.'}
          </div>
        )}
        {filtered.map((d) => {
          const isActive = d.id === activeId;
          const bg = isMine(d) ? 'bg-green-100' : 'bg-gray-100';
          const ring = isActive
            ? 'border border-dashed border-green-500'
            : 'border border-transparent border-b-gray-50';
          return (
            <button
              key={d.id}
              onClick={() => setActiveId(d.id)}
              className={`w-full text-left px-3 py-3 transition-colors hover:brightness-95 ${bg} ${ring}`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 text-sm truncate min-w-0">{d.clientName}</span>
                {d.crmStatus && <CrmBadge status={d.crmStatus} small short />}
                <span className="text-[11px] text-gray-400 ml-auto">{fmtTime(d.lastTime)}</span>
                {d.unread > 0 && (
                  <span className="bg-green-500 text-white text-[11px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{d.unread}</span>
                )}
              </div>
              {(d.crmStatus === 'client' || d.crmStatus === 'lead') && d.childName && (
                <div className="text-[11px] text-gray-500 mt-0.5 truncate">Ученик: {d.childName}</div>
              )}
              <div className="text-[11px] text-gray-400 mt-1.5 truncate">{d.assignee}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DialogList;