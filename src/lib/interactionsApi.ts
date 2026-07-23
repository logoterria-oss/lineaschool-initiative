const API_URL = 'https://functions.poehali.dev/c251547a-6d0d-4d86-9a3c-1b5bd6054b77';

export type CrmStatus = 'teacher' | 'client' | 'lead' | 'unknown';

export interface DialogItem {
  id: number;
  chatId: string;
  clientName: string;
  phone: string;
  assignee: string;
  status: 'lead' | 'client';
  unread: number;
  lastTime: string | null;
  preview: string;
  channels: string[];
  crmStatus: CrmStatus | null;
  crmLabel: string | null;
}

export interface MessageItem {
  id: number;
  direction: 'in' | 'out';
  channel: string;
  text: string;
  author: string | null;
  isTranscript: boolean;
  time: string | null;
}

export async function fetchDialogs(): Promise<DialogItem[]> {
  const r = await fetch(`${API_URL}?action=dialogs`);
  const data = await r.json();
  return data.dialogs || [];
}

export async function fetchMessages(dialogId: number): Promise<MessageItem[]> {
  const r = await fetch(`${API_URL}?action=messages&dialog_id=${dialogId}`);
  const data = await r.json();
  return data.messages || [];
}

export async function sendMessage(dialogId: number, text: string, author: string): Promise<boolean> {
  const r = await fetch(`${API_URL}?action=send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dialog_id: dialogId, text, author }),
  });
  const data = await r.json();
  return !!data.ok;
}

export async function assignDialog(dialogId: number, assignee: string): Promise<boolean> {
  const r = await fetch(`${API_URL}?action=assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dialog_id: dialogId, assignee }),
  });
  const data = await r.json();
  return !!data.ok;
}

export async function resolveCrm(
  dialogId: number,
  force = false,
): Promise<{ crmStatus: CrmStatus; crmLabel: string | null }> {
  const r = await fetch(`${API_URL}?action=resolve-crm&dialog_id=${dialogId}${force ? '&force=1' : ''}`);
  const data = await r.json();
  return { crmStatus: data.crmStatus || 'unknown', crmLabel: data.crmLabel || null };
}

export const WEBHOOK_URL = `${API_URL}?action=webhook`;