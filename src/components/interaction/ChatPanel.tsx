import { RefObject, useState } from 'react';
import Icon from '@/components/ui/icon';
import { DialogItem, MessageItem } from '@/lib/interactionsApi';
import { CrmBadge, ChannelBadge, MessageBubble } from './interactionShared';
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

const CHANNEL_LABEL: Record<string, string> = { max: 'Max', telegram: 'Telegram' };
const CHANNEL_SHORT: Record<string, string> = { max: 'Max', telegram: 'Tg' };

interface ChatPanelProps {
  active: DialogItem | null;
  loading: boolean;
  resolving: boolean;
  messages: MessageItem[];
  scrollRef: RefObject<HTMLDivElement>;
  draft: string;
  setDraft: (v: string) => void;
  send: () => void;
  sending: boolean;
  canWrite: boolean;
  switchChannel: (channel: string) => void;
  call: () => void;
}

const ChatPanel = ({
  active,
  loading,
  resolving,
  messages,
  scrollRef,
  draft,
  setDraft,
  send,
  sending,
  canWrite,
  switchChannel,
  call,
}: ChatPanelProps) => {
  const [confirmChannel, setConfirmChannel] = useState<string | null>(null);

  if (!active) {
    return (
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center text-gray-400">
        {loading ? 'Загрузка…' : 'Выберите диалог'}
      </div>
    );
  }

  const channel = active.channel || 'max';
  const channelLabel = CHANNEL_LABEL[channel] || 'Max';
  // Другой мессенджер доступен, если у контакта есть контакт для него.
  const otherChannel = channel === 'max' ? 'telegram' : 'max';
  const otherAvailable = otherChannel === 'telegram' ? !!active.tgUsername : !!active.phone;

  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 lg:hidden">
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <Icon name="User" size={18} className="text-green-600" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">{active.clientName}</div>
          {(active.crmStatus === 'client' || active.crmStatus === 'lead') && active.childName && (
            <div className="text-xs text-gray-500 truncate">Ученик: {active.childName}</div>
          )}
          {active.phone && <div className="text-xs text-gray-400">{active.phone}</div>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {resolving && !active.crmStatus ? (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Icon name="Loader" size={12} className="animate-spin" /> CRM…
            </span>
          ) : (
            <CrmBadge status={active.crmStatus} label={active.crmStatus === 'parent' ? 'Родитель' : active.crmLabel} />
          )}
          {active.channels.map((c) => <ChannelBadge key={c} channel={c} />)}
        </div>
      </div>

      {/* Шапка средней колонки (ПК): мессенджер, переключение, вызов */}
      <div className="hidden lg:flex px-4 py-2.5 border-b border-gray-100 items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ChannelBadge channel={channel} />
          <span>
            Переписка в <span className="font-medium text-gray-900">{channelLabel}</span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {otherAvailable && (
            <button
              onClick={() => setConfirmChannel(otherChannel)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-700 bg-gray-50 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
              title={`Перейти в ${CHANNEL_LABEL[otherChannel]}`}
            >
              <Icon name="ArrowLeftRight" size={15} />
              {CHANNEL_SHORT[otherChannel]}
            </button>
          )}
          <button
            onClick={call}
            className="flex items-center justify-center w-9 h-9 text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors"
            title="Позвонить клиенту"
          >
            <Icon name="Phone" size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 bg-gray-50/50">
        {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
      </div>

      {canWrite ? (
        <div className="border-t border-gray-100 p-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-400">
            <ChannelBadge channel={channel} size={12} />
            Ответ уйдёт в {channelLabel}
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder="Напишите сообщение клиенту..."
              className="flex-1 resize-none px-3 py-2.5 text-sm rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-green-400 max-h-32"
            />
            <button
              onClick={send}
              disabled={sending}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <Icon name={sending ? 'Loader' : 'Send'} size={18} className={sending ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-100 p-4 flex-shrink-0 flex items-center gap-2 text-sm text-gray-500 bg-gray-50/60">
          <Icon name="Lock" size={15} className="text-gray-400 flex-shrink-0" />
          Отвечать может только ответственный за этот чат
          {active.assignee && active.assignee !== 'Не назначен' && (
            <span className="text-gray-400">— {active.assignee}</span>
          )}
        </div>
      )}

      <AlertDialog open={!!confirmChannel} onOpenChange={(o) => !o && setConfirmChannel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Перейти в другой мессенджер?</AlertDialogTitle>
            <AlertDialogDescription>
              Дальнейшие ответы клиенту будут уходить через{' '}
              <span className="font-medium text-gray-700">
                {confirmChannel ? CHANNEL_LABEL[confirmChannel] : ''}
              </span>
              . История переписки останется общей.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmChannel) switchChannel(confirmChannel);
                setConfirmChannel(null);
              }}
            >
              Перейти
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatPanel;