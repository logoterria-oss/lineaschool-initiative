export const GET_LEADS_URL = 'https://functions.poehali.dev/63eeb76f-c729-4aa3-a483-7f5b321bc4c2';
export const SYNC_URL = 'https://functions.poehali.dev/af003b32-0a7b-432b-a657-9e8c28bfe436';
export const DELETE_URL = 'https://functions.poehali.dev/264c82a7-ca44-425a-bbf1-4006cda9e33e';
export const BLOCKLIST_URL = 'https://functions.poehali.dev/c892bd2c-ff6b-488b-8f0c-67f73cbf4300';

export interface PaymentLead {
  id: number;
  name: string;
  plan: string;
  amount: number;
  order_id: string;
  created_at: string;
  paid_at: string | null;
  transaction_id: string | null;
  source?: string;
}

export interface BlockedPayment {
  id: number;
  order_id: string;
  transaction_id: string;
  name: string;
  reason: string;
  blocked_at: string | null;
}
