"use client";
import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/Modal";

interface Comp {
  id: string;
  name: string;
  color: string;
  notes: string | null;
  contact_count: number;
}

const COLORS = ["#3270f6", "#f59e0b", "#10b981", "#a855f7", "#ef4444", "#06b6d4", "#ec4899"];

export default function CompaniesPage() {
  const [items, setItems] = useState<Comp[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Comp | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/companies");
    const d = await res.json();
    setItems(Array.isArray(d) ? d : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function del(id: string) {
    if (!confirm("Firma loeschen? Kontakte bleiben erhalten (ohne Firma).")) return;
    await fetch(`/api/companies/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Firmen</h1>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          + Neu
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Lade…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-4 w-4 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="flex-1 font-medium">{c.name}</span>
              </div>
              {c.notes && <p className="mt-2 text-sm text-slate-500">{c.notes}</p>}
              <p className="mt-2 text-xs text-slate-400">{c.contact_count} Kontakt(e)</p>
              <div className="mt-3 flex gap-2">
                <button className="btn-secondary flex-1" onClick={() => setEdit(c)}>
                  Bearbeiten
                </button>
                <button className="btn-ghost" onClick={() => del(c.id)}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showNew || edit) && (
        <CompanyModal
          company={edit}
          onClose={() => {
            setShowNew(false);
            setEdit(null);
          }}
          onSaved={() => {
            setShowNew(false);
            setEdit(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function CompanyModal({
  company,
  onClose,
  onSaved,
}: {
  company: Comp | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(company?.name ?? "");
  const [color, setColor] = useState(company?.color ?? COLORS[0]);
  const [notes, setNotes] = useState(company?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim()) {
      setError("Name erforderlich.");
      return;
    }
    setBusy(true);
    const res = await fetch(
      company ? `/api/companies/${company.id}` : "/api/companies",
      {
        method: company ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, notes }),
      }
    );
    setBusy(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Fehler.");
      return;
    }
    onSaved();
  }

  return (
    <Modal title={company ? "Firma bearbeiten" : "Neue Firma"} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Farbe</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((col) => (
              <button
                key={col}
                onClick={() => setColor(col)}
                className={`h-8 w-8 rounded-full ${color === col ? "ring-2 ring-offset-2 ring-brand-500" : ""}`}
                style={{ backgroundColor: col }}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="label">Notizen</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button className="btn-primary" onClick={save} disabled={busy}>
            Speichern
          </button>
        </div>
      </div>
    </Modal>
  );
}
