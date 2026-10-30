"use client";
import { useState } from "react";
import { CONTACT_STATUSES, type Company } from "@/lib/types";

export interface ContactFormValues {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  birthday: string;
  status: string;
  company_id: string;
  tags: string[];
}

export function emptyContact(): ContactFormValues {
  return {
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    whatsapp: "",
    address: "",
    birthday: "",
    status: "Lead",
    company_id: "",
    tags: [],
  };
}

export default function ContactForm({
  initial,
  companies,
  onSubmit,
  onCancel,
  submitLabel = "Speichern",
}: {
  initial: ContactFormValues;
  companies: Company[];
  onSubmit: (v: ContactFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [v, setV] = useState<ContactFormValues>(initial);
  const [tagInput, setTagInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof ContactFormValues>(k: K, val: ContactFormValues[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !v.tags.includes(t)) set("tags", [...v.tags, t]);
    setTagInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.first_name.trim()) {
      setError("Vorname ist erforderlich.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await onSubmit(v);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Vorname *</label>
          <input
            className="input"
            value={v.first_name}
            onChange={(e) => set("first_name", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Nachname</label>
          <input
            className="input"
            value={v.last_name}
            onChange={(e) => set("last_name", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Telefon</label>
          <input
            className="input"
            value={v.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <div>
          <label className="label">WhatsApp</label>
          <input
            className="input"
            value={v.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
          />
        </div>
        <div>
          <label className="label">E-Mail</label>
          <input
            type="email"
            className="input"
            value={v.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Geburtstag</label>
          <input
            type="date"
            className="input"
            value={v.birthday}
            onChange={(e) => set("birthday", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Firma / Produktlinie</label>
          <select
            className="input"
            value={v.company_id}
            onChange={(e) => set("company_id", e.target.value)}
          >
            <option value="">— keine —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={v.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {CONTACT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Adresse</label>
        <textarea
          className="input"
          rows={2}
          value={v.address}
          onChange={(e) => set("address", e.target.value)}
        />
      </div>

      <div>
        <label className="label">Tags</label>
        <div className="mb-2 flex flex-wrap gap-2">
          {v.tags.map((t) => (
            <span
              key={t}
              className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {t}
              <button
                type="button"
                className="ml-1 text-slate-400 hover:text-red-500"
                onClick={() => set("tags", v.tags.filter((x) => x !== t))}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Tag hinzufuegen…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <button type="button" className="btn-secondary" onClick={addTag}>
            +
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Abbrechen
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Speichern…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
