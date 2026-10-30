// Gemeinsame Formatierungs-/Darstellungs-Helfer (Client + Server).
import type { ContactStatus, InteractionType } from "./types";

export function fmtDate(d?: string | null): string {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function fmtDateTime(d?: string | null): string {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(first?: string | null, last?: string | null): string {
  return `${(first ?? "").charAt(0)}${(last ?? "").charAt(0)}`.toUpperCase() || "?";
}

export const STATUS_BADGE: Record<ContactStatus, string> = {
  Lead: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  Interessent: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Kunde: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Partner: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
};

export const INTERACTION_LABEL: Record<InteractionType, string> = {
  call: "Anruf",
  message: "Nachricht",
  meeting: "Treffen",
  email: "E-Mail",
  whatsapp: "WhatsApp",
  note: "Notiz",
};

export const INTERACTION_ICON: Record<InteractionType, string> = {
  call: "📞",
  message: "💬",
  meeting: "🤝",
  email: "✉️",
  whatsapp: "🟢",
  note: "📝",
};
