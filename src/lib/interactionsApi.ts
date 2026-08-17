import { INTERACTION_API_URL } from './interactionUrl';

/** Токен сотрудника — тот же, что и во внешнем окне взаимодействия. */
const authHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const token = localStorage.getItem('staff_token') || '';
  return token ? { ...extra, 'X-Auth-Token': token } : extra;
};

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

/** Диалоги берём из внешнего окна взаимодействия — там живут все переписки. */
export async function fetchDialogs(): Promise<DialogItem[]> {
  const r = await fetch(`${INTERACTION_API_URL}?action=dialogs`, { headers: authHeaders() });
  if (!r.ok) return [];
  const data = await r.json();
  return data.dialogs || [];
}
