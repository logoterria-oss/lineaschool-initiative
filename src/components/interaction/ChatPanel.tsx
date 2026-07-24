import { RefObject } from 'react';
import Icon from '@/components/ui/icon';
import { DialogItem, MessageItem } from '@/lib/interactionsApi';
import { CrmBadge, ChannelBadge, MessageBubble } from './interactionShared';

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
}: ChatPanelProps) => {
  if (!active) {
    return (
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center text-gray-400">
        {loading ? 'Загрузка…' : 'Выберите диалог'}
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <Icon name="User" size={18} className="text-green-600" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">{active.clientName}</div>
          {active.childName && (
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

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 bg-gray-50/50">
        {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
      </div>

      <div className="border-t border-gray-100 p-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-400">
          <ChannelBadge channel="max" size={12} />
          Ответ уйдёт в Max
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
    </div>
  );
};

export default ChatPanel;
