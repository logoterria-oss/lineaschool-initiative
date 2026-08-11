import Icon from '@/components/ui/icon';
import { CrmContact } from '@/lib/interactionsApi';

interface NewDialogModalProps {
  onClose: () => void;
  crmQuery: string;
  setCrmQuery: (v: string) => void;
  crmSearching: boolean;
  crmResults: CrmContact[];
  startDialog: (c: CrmContact) => void;
  creating: boolean;
}

const NewDialogModal = ({
  onClose,
  crmQuery,
  setCrmQuery,
  crmSearching,
  crmResults,
  startDialog,
  creating,
}: NewDialogModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[70vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-lg text-gray-900">Новый диалог</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <Icon name="X" size={20} />
          </button>
        </div>
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={crmQuery}
              onChange={(e) => setCrmQuery(e.target.value)}
              placeholder="Поиск: сотрудник, родитель или ребёнок"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-green-400"
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">Сотрудники школы, клиенты и лиды из CRM</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {crmSearching && <div className="p-4 text-sm text-gray-400 text-center">Ищем…</div>}
          {!crmSearching && crmQuery.trim().length >= 2 && crmResults.length === 0 && (
            <div className="p-6 text-sm text-gray-400 text-center">Никого не нашли</div>
          )}
          {!crmSearching && crmQuery.trim().length < 2 && (
            <div className="p-6 text-sm text-gray-400 text-center">Введите минимум 2 символа</div>
          )}
          {crmResults.map((c) => (
            <button
              key={c.phone}
              onClick={() => startDialog(c)}
              disabled={creating}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-60 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Icon name="User" size={18} className="text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 text-sm truncate">{c.parent || c.child || c.phone}</div>
                {c.child && c.parent && (
                  <div className="text-[11px] text-gray-500 truncate">Ученик: {c.child}</div>
                )}
                <div className="text-[11px] text-gray-400">{c.phone}</div>
              </div>
              <span className="text-[11px] text-gray-400 flex-shrink-0">{c.statusLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewDialogModal;
