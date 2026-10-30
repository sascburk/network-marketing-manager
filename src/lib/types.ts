export type Role = "admin" | "member";

export interface User {
  id: string;
  team_id: string | null;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  team_id: string | null;
  name: string;
  color: string;
  notes: string | null;
  created_at: string;
}

export type ContactStatus = "Lead" | "Interessent" | "Kunde" | "Partner";

export const CONTACT_STATUSES: ContactStatus[] = [
  "Lead",
  "Interessent",
  "Kunde",
  "Partner",
];

export interface Contact {
  id: string;
  team_id: string | null;
  owner_id: string | null;
  company_id: string | null;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  address: string | null;
  birthday: string | null;
  status: ContactStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  contact_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

export type InteractionType =
  | "call"
  | "message"
  | "meeting"
  | "email"
  | "whatsapp"
  | "note";

export interface Interaction {
  id: string;
  contact_id: string;
  author_id: string | null;
  type: InteractionType;
  summary: string;
  occurred_at: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  team_id: string | null;
  contact_id: string | null;
  user_id: string | null;
  title: string;
  due_at: string;
  done: boolean;
  notified: boolean;
  created_at: string;
}
