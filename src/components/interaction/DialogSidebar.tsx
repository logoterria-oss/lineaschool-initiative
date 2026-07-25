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
  saveContacts: (contacts: { phone?: string; tgUsername?: string }) => Promise<void>;
}

const SUPERVISOR = 'абраменко виктория';

const DialogSidebar = ({ active, resolving, refreshCrm, assignees, reassign, currentUser, saveContacts }: DialogSidebarProps) => {
  const [pending, setPending] = useState<string | null>(null);
  const [editContacts, setEditContacts] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [tgInput, setTgInput] = useState('');
  const [savingContacts, setSavingContacts] = useState(false);

  const me = currentUser.trim().toLowerCase();
  const isSupervisor = me.includes(SUPERVISOR);
  const isCurrentAssignee = active.assignee.trim().toLowerCase() === me;
  const canReassign = !!currentUser && (isSupervisor || isCurrentAssignee);

  const confirmReassign = () => {
    if (pending) reassign(pending);
    setPending(null);
  };

  const openContactsEdit = () => {
    setPhoneInput(active.phone || '');
    setTgInput(active.tgUsername || '');
    setEditContacts(true);
  };

  const submitContacts = async () => {
    setSavingContacts(true);
    await saveContacts({ phone: phoneInput.trim(), tgUsername: tgInput.trim() });
    setSavingContacts(false);
    setEditContacts(false);
  };

  return (
    <div className="w-full lg:w-64 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
      <div>
        <div className="text-xs text-gray-400 mb-1">Клиент</div>
        <div className="font-semibold text-gray-900">{active.clientName}</div>
        {(active.crmStatus === 'client' || active.crmStatus === 'lead') && active.childName && (
          <div className="text-sm text-gray-500">Ученик: {active.childName}</div>
        )}
        <div className="mt-2 flex items-center gap-1">
          <span className="text-xs text-gray-400">Способы связи</span>
          <button
            onClick={openContactsEdit}
            title="Добавить или изменить контакты"
            className="text-gray-300 hover:text-green-600"
          >
            <Icon name="Plus" size={13} />
          </button>
        </div>

        {editContacts ? (
          <div className="mt-1 space-y-2">
            <div className="relative">
              <Icon name="MessageCircle" size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-500" />
              <input
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Телефон (Max)"
                className="w-full pl-7 pr-2 py-1.5 text-sm rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-green-400"
              />
            </div>
            <div className="relative">
              <Icon name="Send" size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-sky-500" />
              <input
                value={tgInput}
                onChange={(e) => setTgInput(e.target.value)}
                placeholder="@username (Telegram)"
                className="w-full pl-7 pr-2 py-1.5 text-sm rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-green-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={submitContacts}
                disabled={savingContacts}
                className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white transition-colors"
              >
                {savingContacts ? 'Сохранение…' : 'Сохранить'}
              </button>
              <button
                onClick={() => setEditContacts(false)}
                className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {active.phone && (
              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <Icon name="MessageCircle" size={13} className="text-blue-500" />
                {active.phone}
              </div>
            )}
            {active.tgUsername && (
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
            )}
            {!active.phone && !active.tgUsername && (
              <div className="text-sm text-gray-400">Не указаны</div>
            )}
          </div>
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