"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import ContactForm, { type ContactFormValues } from "@/components/ContactForm";
import AiPanel from "@/components/AiPanel";
import {
  STATUS_BADGE,
  initials,
  fmtDate,
  fmtDateTime,
  INTERACTION_LABEL,
  INTERACTION_ICON,
} from "@/lib/format";
import type { Company, InteractionType } from "@/lib/types";

interface Detail {
  contact: {
    id: string;
    first_name: string;
    last_name: string | null;
    phone: string | null;
    email: string | null;
    whatsapp: string | null;
    address: string | null;
    birthday: string | null;
    status: "Lead" | "Interessent" | "Kunde" | "Partner";
    tags: string[];
    company_id: string | null;
    company_name: string | null;
    company_color: string | null;
    owner_id: string | null;
    owner_name: string | null;
  };
  notes: { id: string; body: string; created_at: string; author_name: string | null }[];
  interactions: {
    id: string;
    type: InteractionType;
    summary: string;
    occurred_at: string;
    author_name: string | null;
  }[];
  reminders: { id: string; title: string; due_at: string; done: boolean }[];
  shares: { user_id: string; name: string }[];
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [noteBody, setNoteBody] = useState("");
  const [ixType, setIxType] = useState<InteractionType>("call");
  const [ixSummary, setIxSummary] = useState("");
  const [remTitle, setRemTitle] = useState("");
  const [remDue, setRemDue] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/contacts/${id}`);
    if (!res.ok) {
      setData(null);
      setLoading(false);
      return;
    }
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
    fetch("/api/companies").then((r) => r.json()).then((d) => setCompanies(Array.isArray(d) ? d : []));
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers(Array.isArray(d) ? d : []));
  }, [load]);

  if (loading) return <p className="text-sm text-slate-500">Lade…</p>;
  if (!data || !data.contact)
    return (
      <div className="card text-center text-slate-500">
        Kontakt nicht gefunden oder kein Zugriff.
      </div>
    );

  const c = data.contact;
  const name = `${c.first_name} ${c.last_name ?? ""}`.trim();

  async function saveEdit(v: ContactFormValues) {
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || "Fehler beim Speichern.");
    }
    setEditing(false);
    load();
  }

  async function del() {
    if (!confirm("Diesen Kontakt wirklich loeschen?")) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    router.push("/contacts");
  }

  async function addNote() {
    if (!noteBody.trim()) return;
    await fetch(`/api/contacts/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: noteBody }),
    });
    setNoteBody("");
    load();
  }

  async function addInteraction() {
    if (!ixSummary.trim()) return;
    await fetch(`/api/contacts/${id}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: ixType, summary: ixSummary }),
    });
    setIxSummary("");
    load();
  }

  async function addReminder() {
    if (!remTitle.trim() || !remDue) return;
    await fetch(`/api/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_id: id, title: remTitle, due_at: new Date(remDue).toISOString() }),
    });
    setRemTitle("");
    setRemDue("");
    load();
  }

  async function toggleReminder(rid: string, done: boolean) {
    await fetch(`/api/reminders/${rid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    load();
  }

  async function saveShares(userIds: string[]) {
    await fetch(`/api/contacts/${id}/share`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds }),
    });
    setSharing(false);
    load();
  }

  return (
    <div className="space-y-5">
      <button onClick={() => router.push("/contacts")} className="btn-ghost -ml-2 text-sm">
        ← Zurueck zu Kontakten
      </button>

      {/* Kopf */}
      <div className="card">
        <div className="flex flex-wrap items-start gap-4">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white"
            style={{ backgroundColor: c.company_color || "#3270f6" }}
          >
            {initials(c.first_name, c.last_name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{name}</h1>
              <span className={`badge ${STATUS_BADGE[c.status]}`}>{c.status}</span>
            </div>
            <p className="text-sm text-slate-500">{c.company_name || "—"}</p>
            <p className="mt-1 text-xs text-slate-400">
              Besitzer: {c.owner_name || "—"}
              {data.shares.length > 0 && (
                <> · Geteilt mit: {data.shares.map((s) => s.name).join(", ")}</>
              )}
            </p>
            {c.tags?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {c.tags.map((t) => (
                  <span key={t} className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => setEditing(true)}>
              Bearbeiten
            </button>
            <button className="btn-secondary" onClick={() => setSharing(true)}>
              Teilen
            </button>
            <button className="btn-danger" onClick={del}>
              Loeschen
            </button>
          </div>
        </div>

        {/* Kontaktwege */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {c.phone && (
            <a href={`tel:${c.phone}`} className="btn-secondary justify-start">
              📞 {c.phone}
            </a>
          )}
          {c.whatsapp && (
            <a
              href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              className="btn-secondary justify-start"
            >
              🟢 WhatsApp: {c.whatsapp}
            </a>
          )}
          {c.email && (
            <a href={`mailto:${c.email}`} className="btn-secondary justify-start">
              ✉️ {c.email}
            </a>
          )}
          {c.birthday && (
            <div className="btn-secondary justify-start">🎂 {fmtDate(c.birthday)}</div>
          )}
          {c.address && (
            <div className="btn-secondary justify-start sm:col-span-2">📍 {c.address}</div>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* KI */}
        <AiPanel contactId={c.id} />

        {/* Follow-ups */}
        <div className="card">
          <h2 className="mb-3 font-semibold">⏰ Follow-ups</h2>
          <div className="mb-3 space-y-2">
            {data.reminders.length === 0 && (
              <p className="text-sm text-slate-500">Keine Follow-ups.</p>
            )}
            {data.reminders.map((r) => (
              <label
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-2 dark:border-slate-700"
              >
                <input
                  type="checkbox"
                  checked={r.done}
                  onChange={(e) => toggleReminder(r.id, e.target.checked)}
                  className="h-4 w-4"
                />
                <span className={`flex-1 text-sm ${r.done ? "text-slate-400 line-through" : ""}`}>
                  {r.title}
                </span>
                <span className="text-xs text-slate-500">{fmtDate(r.due_at)}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="input"
              placeholder="Titel"
              value={remTitle}
              onChange={(e) => setRemTitle(e.target.value)}
            />
            <input
              type="datetime-local"
              className="input sm:w-56"
              value={remDue}
              onChange={(e) => setRemDue(e.target.value)}
            />
            <button className="btn-primary" onClick={addReminder}>
              +
            </button>
          </div>
        </div>

        {/* Interaktionen */}
        <div className="card">
          <h2 className="mb-3 font-semibold">Interaktions-Historie</h2>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <select
              className="input sm:w-40"
              value={ixType}
              onChange={(e) => setIxType(e.target.value as InteractionType)}
            >
              {(Object.keys(INTERACTION_LABEL) as InteractionType[]).map((t) => (
                <option key={t} value={t}>
                  {INTERACTION_ICON[t]} {INTERACTION_LABEL[t]}
                </option>
              ))}
            </select>
            <input
              className="input"
              placeholder="Was ist passiert?"
              value={ixSummary}
              onChange={(e) => setIxSummary(e.target.value)}
            />
            <button className="btn-primary" onClick={addInteraction}>
              +
            </button>
          </div>
          <ul className="space-y-2">
            {data.interactions.length === 0 && (
              <li className="text-sm text-slate-500">Noch keine Interaktionen.</li>
            )}
            {data.interactions.map((i) => (
              <li key={i.id} className="flex gap-3 border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800">
                <span aria-hidden>{INTERACTION_ICON[i.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{i.summary}</p>
                  <p className="text-xs text-slate-400">
                    {INTERACTION_LABEL[i.type]} · {fmtDateTime(i.occurred_at)}
                    {i.author_name ? ` · ${i.author_name}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Notizen */}
        <div className="card">
          <h2 className="mb-3 font-semibold">📝 Notizen</h2>
          <div className="mb-3 flex gap-2">
            <textarea
              className="input"
              rows={2}
              placeholder="Neue Notiz…"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
            />
            <button className="btn-primary self-start" onClick={addNote}>
              +
            </button>
          </div>
          <ul className="space-y-2">
            {data.notes.length === 0 && (
              <li className="text-sm text-slate-500">Noch keine Notizen.</li>
            )}
            {data.notes.map((n) => (
              <li key={n.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
                <p className="whitespace-pre-wrap">{n.body}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {n.author_name ? `${n.author_name} · ` : ""}
                  {fmtDateTime(n.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {editing && (
        <Modal title="Kontakt bearbeiten" onClose={() => setEditing(false)} wide>
          <ContactForm
            initial={{
              first_name: c.first_name,
              last_name: c.last_name ?? "",
              phone: c.phone ?? "",
              email: c.email ?? "",
              whatsapp: c.whatsapp ?? "",
              address: c.address ?? "",
              birthday: c.birthday ? c.birthday.slice(0, 10) : "",
              status: c.status,
              company_id: c.company_id ?? "",
              tags: c.tags ?? [],
            }}
            companies={companies}
            onSubmit={saveEdit}
            onCancel={() => setEditing(false)}
          />
        </Modal>
      )}

      {sharing && (
        <ShareModal
          users={users}
          current={data.shares.map((s) => s.user_id)}
          ownerId={c.owner_id}
          onClose={() => setSharing(false)}
          onSave={saveShares}
        />
      )}
    </div>
  );
}

function ShareModal({
  users,
  current,
  ownerId,
  onClose,
  onSave,
}: {
  users: { id: string; name: string }[];
  current: string[];
  ownerId: string | null;
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(current);
  function toggle(uid: string) {
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );
  }
  return (
    <Modal title="Kontakt teilen" onClose={onClose}>
      <p className="mb-3 text-sm text-slate-500">
        Waehle Team-Mitglieder, die diesen Kontakt ebenfalls sehen und bearbeiten
        duerfen.
      </p>
      <div className="space-y-2">
        {users
          .filter((u) => u.id !== ownerId)
          .map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-2 dark:border-slate-700"
            >
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={selected.includes(u.id)}
                onChange={() => toggle(u.id)}
              />
              <span className="text-sm">{u.name}</span>
            </label>
          ))}
        {users.filter((u) => u.id !== ownerId).length === 0 && (
          <p className="text-sm text-slate-500">Keine weiteren Team-Mitglieder vorhanden.</p>
        )}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>
          Abbrechen
        </button>
        <button className="btn-primary" onClick={() => onSave(selected)}>
          Speichern
        </button>
      </div>
    </Modal>
  );
}
