import Icon from '@/components/ui/icon';
import { DialogItem } from '@/lib/interactionsApi';
import { CrmBadge } from './interactionShared';

interface DialogSidebarProps {
  active: DialogItem;
  resolving: boolean;
  refreshCrm: () => void;
  assignees: string[];
  reassign: (name: string) => void;
}

const DialogSidebar = ({ active, resolving, refreshCrm, assignees, reassign }: DialogSidebarProps) => {
  return (
    <div className="w-full lg:w-64 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
      <div>
        <div className="text-xs text-gray-400 mb-1">Клиент</div>
        <div className="font-semibold text-gray-900">{active.clientName}</div>
        {(active.crmStatus === 'client' || active.crmStatus === 'lead') && active.childName && (
          <div className="text-sm text-gray-500">Ученик: {active.childName}</div>
        )}
        {active.phone && (
          <div className="text-sm text-gray-500">{active.phone}</div>
        )}
      </div>
      <div>
        <div className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
          Статус в CRM
          <button
            onClick={refreshCrm}
            title="Обновить из CRM"
            className="text-gray-300 hover:text-green-600"
          >
            <Icon name="RefreshCw" size={12} className={resolving ? 'animate-spin' : ''} />
          </button>
        </div>
        {active.crmStatus ? (
          <CrmBadge status={active.crmStatus} label={active.crmLabel} />
        ) : (
          <span className="text-sm text-gray-400">Определяем…</span>
        )}
      </div>
      <div>
        <div className="text-xs text-gray-400 mb-1.5">Ответственный</div>
        <div className="space-y-1">
          {assignees.map((name) => (
            <button
              key={name}
              onClick={() => reassign(name)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${active.assignee === name ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {name}
            </button>
          ))}
          {assignees.length === 0 && (
            <div className="text-sm text-gray-400 px-3 py-2">Загрузка сотрудников…</div>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-2">Передача клиента между сотрудниками — вся история сохраняется.</p>
      </div>
    </div>
  );
};

export default DialogSidebar;