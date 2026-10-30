"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Modal from "@/components/Modal";
import ContactForm, { emptyContact } from "@/components/ContactForm";
import { CONTACT_STATUSES, type Company, type ContactStatus } from "@/lib/types";
import { STATUS_BADGE, initials, fmtDate } from "@/lib/format";

interface ContactRow {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  status: ContactStatus;
  tags: string[];
  birthday: string | null;
  company_name: string | null;
  company_color: string | null;
  owner_name: string | null;
  updated_at: string;
}

function ContactsInner() {
  const sp = useSearchParams();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const [q, setQ] = useState("");
  const [scope, setScope] = useState("all");
  const [status, setStatus] = useState(sp.get("status") || "");
  const [company, setCompany] = useState(sp.get("company") || "");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (scope) params.set("scope", scope);
    if (status) params.set("status", status);
    if (company) params.set("company", company);
    const res = await fetch(`/api/contacts?${params.toString()}`);
    const data = await res.json();
    setContacts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [q, scope, status, company]);

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((d) => setCompanies(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (sp.get("new") === "1") setShowNew(true);
  }, [sp]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function createContact(v: Record<string, unknown>) {
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || "Fehler beim Anlegen.");
    }
    setShowNew(false);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kontakte</h1>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          + Neu
        </button>
      </div>

      {/* Filter */}
      <div className="card space-y-3">
        <input
          className="input"
          placeholder="🔍 Suche nach Name, E-Mail, Telefon…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select className="input" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="all">Alle sichtbaren</option>
            <option value="mine">Meine Kontakte</option>
            <option value="shared">Mit mir geteilt</option>
          </select>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Alle Status</option>
            {CONTACT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select className="input" value={company} onChange={(e) => setCompany(e.target.value)}>
            <option value="">Alle Firmen</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <p className="text-sm text-slate-500">Lade…</p>
      ) : contacts.length === 0 ? (
        <div className="card text-center text-slate-500">
          Keine Kontakte gefunden.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((c) => (
            <Link key={c.id} href={`/contacts/${c.id}`} className="card transition hover:shadow-md">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: c.company_color || "#3270f6" }}
                >
                  {initials(c.first_name, c.last_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">
                      {c.first_name} {c.last_name}
                    </span>
                    <span className={`badge shrink-0 ${STATUS_BADGE[c.status]}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {c.company_name || "—"}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {c.phone || c.email || ""}
                  </p>
                  {c.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="badge bg-slate-100 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {c.birthday && (
                    <p className="mt-1 text-[10px] text-slate-400">
                      🎂 {fmtDate(c.birthday)}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showNew && (
        <Modal title="Neuer Kontakt" onClose={() => setShowNew(false)} wide>
          <ContactForm
            initial={emptyContact()}
            companies={companies}
            onSubmit={(v) => createContact(v as unknown as Record<string, unknown>)}
            onCancel={() => setShowNew(false)}
            submitLabel="Anlegen"
          />
        </Modal>
      )}
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Lade…</p>}>
      <ContactsInner />
    </Suspense>
  );
}
