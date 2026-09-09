export const LETTERHEAD_DOCS_URL =
  'https://functions.poehali.dev/b341c802-fad9-4653-9132-bde9fa114aa3';

export interface SavedDoc {
  id: number;
  title: string;
  doc_number: string;
  doc_date: string | null;
  recipient: string;
  body: string;
  signer_post: string;
  signer_name: string;
  city: string;
  stamp_mode: string;
  file_name: string;
  pdf_url: string;
  created_by: string;
  created_at: string;
}