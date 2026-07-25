import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { DialogItem } from '@/lib/interactionsApi';
import { CrmBadge } from './interactionShared';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DialogSidebarProps {
  active: DialogItem;
  resolving: boolean;
  refreshCrm: () => void;
  assignees: string[];
  reassign: (name: string) => void;
  currentUser: string;
}

const SUPERVISOR = 'абраменко виктория';

const DialogSidebar = ({ active, resolving, refreshCrm, assignees, reassign, currentUser }: DialogSidebarProps) => {
  const [pending, setPending] = useState<string | null>(null);

  const me = currentUser.trim().toLowerCase();
  const isSupervisor = me.includes(SUPERVISOR);
  const isCurrentAssignee = active.assignee.trim().toLowerCase() === me;
  const canReassign = !!currentUser && (isSupervisor || isCurrentAssignee);

  const confirmReassign = () => {
    if (pending) reassign(pending);
    setPending(null);
  };

  return (
    <div className="w-full lg:w-64 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
      <div>
        <div className="text-xs text-gray-400 mb-1">Клиент</div>
        <div className="font-semibold text-gray-900">{active.clientName}</div>
        {(active.crmStatus === 'client' || active.crmStatus === 'lead') && active.childName && (
          <div className="text-sm text-gray-500">Ученик: {active.childName}</div>
        )}
        <div className="mt-2 text-xs text-gray-400">Способ связи</div>
        {active.channel === 'telegram' ? (
          active.tgUsername ? (
            <div className="flex items-center gap-1.5 text-sm text-gray-700">
              <Icon name="Send" size={13} className="text-sky-500" />
              <a
                href={`https://t.me/${active.tgUsername.replace(/^@/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                @{active.tgUsername.replace(/^@/, '')}
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <Icon name="Send" size={13} className="text-sky-500" />
              Telegram
            </div>
          )
        ) : active.phone ? (
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <Icon name="MessageCircle" size={13} className="text-blue-500" />
            {active.phone}
          </div>
        ) : (
          <div className="text-sm text-gray-400">—</div>
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
              onClick={() => {
                if (name === active.assignee) return;
                setPending(name);
              }}
              disabled={!canReassign}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${active.assignee === name ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-600 hover:bg-gray-50'} ${!canReassign ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {name}
            </button>
          ))}
          {assignees.length === 0 && (
            <div className="text-sm text-gray-400 px-3 py-2">Загрузка сотрудников…</div>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          {canReassign
            ? 'Передача клиента между сотрудниками — вся история сохраняется.'
            : 'Передать ответственного может только текущий ответственный или руководитель.'}
        </p>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Передать роль ответственного?</AlertDialogTitle>
            <AlertDialogDescription>
              Точно ли вы хотите передать роль ответственного {pending}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReassign}>Передать</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DialogSidebar;