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
  /** Чат передали сотруднику, и он его ещё не открывал — считает сервер */
  newAssigned?: boolean;
  /** Сообщений пришло с момента передачи чата */
  sinceAssign?: number;
}

/**
 * Сообщаем «Окну взаимодействия», что администратор вышел на смену или закрыл её.
 * Окно само решает, кому распределять новые обращения.
 * Если окно ещё не умеет принимать такое сообщение — просто молчим.
 */
export async function notifyShiftChange(action: 'start' | 'finish'): Promise<void> {
  await fetch(`${INTERACTION_API_URL}?action=shift`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ action: 'shift', shift: action, at: new Date().toISOString() }),
  }).catch(() => undefined);
}

/** Диалоги берём из внешнего окна взаимодействия — там живут все переписки. */
export async function fetchDialogs(): Promise<DialogItem[]> {
  const r = await fetch(`${INTERACTION_API_URL}?action=dialogs`, { headers: authHeaders() });
  if (!r.ok) return [];
  const data = await r.json();
  return data.dialogs || [];
}