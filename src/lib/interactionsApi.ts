const API_URL = 'https://functions.poehali.dev/c251547a-6d0d-4d86-9a3c-1b5bd6054b77';

export type CrmStatus = 'staff' | 'teacher' | 'client' | 'lead' | 'parent' | 'unknown';

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
  channel: string;
  tgUsername: string | null;
  crmStatus: CrmStatus | null;
  crmLabel: string | null;
  childName: string | null;
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

export async function fetchAssignees(): Promise<string[]> {
  const r = await fetch(`${API_URL}?action=assignees`);
  if (!r.ok) return [];
  const data = await r.json();
  return data.assignees || [];
}

export interface CrmContact {
  phone: string;
  parent: string | null;
  child: string | null;
  status: 'client' | 'lead' | 'staff' | 'teacher';
  statusLabel: string;
}

export async function searchCrmContacts(query: string): Promise<CrmContact[]> {
  const r = await fetch(`${API_URL}?action=crm-search&q=${encodeURIComponent(query)}`);
  if (!r.ok) return [];
  const data = await r.json();
  return data.results || [];
}

export async function createDialog(contact: {
  phone: string;
  parent: string | null;
  child: string | null;
  status: string;
}): Promise<{ ok: boolean; dialogId?: number; message?: string }> {
  const r = await fetch(`${API_URL}?action=create-dialog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact),
  });
  const data = await r.json();
  return { ok: !!data.ok, dialogId: data.dialog_id, message: data.message };
}

export async function fetchMessages(dialogId: number): Promise<MessageItem[]> {
  const r = await fetch(`${API_URL}?action=messages&dialog_id=${dialogId}`);
  const data = await r.json();
  return data.messages || [];
}

export async function sendMessage(
  dialogId: number,
  text: string,
  author: string,
): Promise<{ ok: boolean; message?: string }> {
  const r = await fetch(`${API_URL}?action=send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dialog_id: dialogId, text, author }),
  });
  const data = await r.json();
  return { ok: !!data.ok, message: data.message };
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
): Promise<{ crmStatus: CrmStatus; crmLabel: string | null; childName: string | null }> {
  const r = await fetch(`${API_URL}?action=resolve-crm&dialog_id=${dialogId}${force ? '&force=1' : ''}`);
  const data = await r.json();
  return {
    crmStatus: data.crmStatus || 'unknown',
    crmLabel: data.crmLabel || null,
    childName: data.childName || null,
  };
}

export async function setContacts(
  dialogId: number,
  contacts: { phone?: string; tgUsername?: string },
): Promise<boolean> {
  const r = await fetch(`${API_URL}?action=set-contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dialog_id: dialogId, ...contacts }),
  });
  const data = await r.json();
  return !!data.ok;
}

export async function setChannel(dialogId: number, channel: string): Promise<boolean> {
  const r = await fetch(`${API_URL}?action=set-channel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dialog_id: dialogId, channel }),
  });
  const data = await r.json();
  return !!data.ok;
}

export const WEBHOOK_URL = `${API_URL}?action=webhook`;