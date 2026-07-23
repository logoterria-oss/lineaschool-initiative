import func2url from '../../backend/func2url.json';

const AUTH_URL = (func2url as Record<string, string>)['staff-auth'];
const MANAGE_URL = (func2url as Record<string, string>)['staff-manage'];

const TOKEN_KEY = 'staff_token';

export type StaffRole = 'teacher' | 'diag' | 'admin' | 'head';
export type StaffStatus = 'pending' | 'active' | 'blocked';

export interface Staff {
  id: number;
  full_name: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  avatar_url?: string | null;
  job_title?: string | null;
  created_at?: string;
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  teacher: 'Педагог',
  diag: 'Диагност',
  admin: 'Администратор',
  head: 'Руководитель',
};

export const STATUS_LABELS: Record<StaffStatus, string> = {
  pending: 'Ожидает подтверждения',
  active: 'Активен',
  blocked: 'Заблокирован',
};

export function getStaffToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStaffToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStaffToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function post(url: string, body: object, withAuth = false) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = getStaffToken();
    if (token) headers['X-Auth-Token'] = token;
  }
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function registerStaff(input: {
  full_name: string;
  phone: string;
  password: string;
  role: StaffRole;
}) {
  return post(AUTH_URL, { action: 'register', ...input });
}

export async function confirmEmail(phone: string, email: string) {
  return post(AUTH_URL, { action: 'confirm_email', phone, email });
}

export async function verifyEmailCode(phone: string, code: string) {
  return post(AUTH_URL, { action: 'verify_email', phone, code });
}

export async function resendCode(phone: string) {
  return post(AUTH_URL, { action: 'resend_code', phone });
}

export async function forgotPassword(phone: string) {
  return post(AUTH_URL, { action: 'forgot_password', phone });
}

export async function resetPassword(phone: string, code: string, newPassword: string) {
  return post(AUTH_URL, { action: 'reset_password', phone, code, new_password: newPassword });
}

export async function loginStaff(phone: string, password: string) {
  const r = await post(AUTH_URL, { action: 'login', phone, password });
  if (r.ok && r.data.token) setStaffToken(r.data.token);
  return r;
}

export async function fetchMe(): Promise<Staff | null> {
  const token = getStaffToken();
  if (!token) return null;
  const res = await fetch(`${AUTH_URL}?action=me`, {
    headers: { 'X-Auth-Token': token },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.staff || null;
}

export async function changePassword(oldPassword: string, newPassword: string) {
  return post(AUTH_URL, { action: 'change_password', old_password: oldPassword, new_password: newPassword }, true);
}

export async function setJobTitle(jobTitle: string) {
  return post(AUTH_URL, { action: 'set_title', job_title: jobTitle }, true);
}

export async function setPhone(phone: string) {
  return post(AUTH_URL, { action: 'set_phone', phone }, true);
}

export async function uploadAvatar(file: Blob) {
  const base64: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return post(
    AUTH_URL,
    { action: 'set_avatar', content_type: file.type || 'image/jpeg', image_base64: base64 },
    true,
  );
}

export async function logoutStaff() {
  await post(AUTH_URL, { action: 'logout' }, true);
  clearStaffToken();
}

export async function listStaff(): Promise<Staff[]> {
  const token = getStaffToken();
  const res = await fetch(MANAGE_URL, { headers: token ? { 'X-Auth-Token': token } : {} });
  if (!res.ok) return [];
  const data = await res.json();
  return data.staff || [];
}

export async function setStaffStatus(id: number, status: StaffStatus) {
  return post(MANAGE_URL, { action: 'set_status', id, status }, true);
}

export async function setStaffRole(id: number, role: StaffRole) {
  return post(MANAGE_URL, { action: 'set_role', id, role }, true);
}

export async function deleteStaff(id: number) {
  return post(MANAGE_URL, { action: 'delete', id }, true);
}