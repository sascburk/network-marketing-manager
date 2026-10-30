"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fmtDateTime } from "@/lib/format";

interface Rem {
  id: string;
  title: string;
  due_at: string;
  done: boolean;
  contact_id: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
}

export default function RemindersPage() {
  const [items, setItems] = useState<Rem[]>([]);
  const [showDone, setShowDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reminders?done=${showDone ? "1" : "0"}`);
    const d = await res.json();
    setItems(Array.isArray(d) ? d : []);
    setLoading(false);
  }, [showDone]);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!title.trim() || !due) return;
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, due_at: new Date(due).toISOString() }),
    });
    setTitle("");
    setDue("");
    load();
  }

  async function toggle(id: string, done: boolean) {
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    load();
  }

  async function del(id: string) {
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    load();
  }

  const now = new Date();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Follow-ups</h1>

      <div className="card">
        <h2 className="mb-3 font-semibold">Neue Erinnerung</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="input"
            placeholder="Titel (z.B. Anna wegen Probe anrufen)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="datetime-local"
            className="input sm:w-60"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <button className="btn-primary" onClick={add}>
            Hinzufuegen
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-500">
        <input
          type="checkbox"
          checked={showDone}
          onChange={(e) => setShowDone(e.target.checked)}
        />
        Erledigte anzeigen
      </label>

      {loading ? (
        <p className="text-sm text-slate-500">Lade…</p>
      ) : items.length === 0 ? (
        <div className="card text-center text-slate-500">Keine Follow-ups 🎉</div>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => {
            const overdue = !r.done && new Date(r.due_at) < now;
            return (
              <li key={r.id} className="card flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={r.done}
                  onChange={(e) => toggle(r.id, e.target.checked)}
                  className="h-5 w-5"
                />
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${r.done ? "text-slate-400 line-through" : ""}`}>
                    {r.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {r.contact_id ? (
                      <Link href={`/contacts/${r.contact_id}`} className="text-brand-600">
                        {r.first_name} {r.last_name}
                        {r.company_name ? ` · ${r.company_name}` : ""}
                      </Link>
                    ) : (
                      "Allgemein"
                    )}
                  </p>
                </div>
                <span
                  className={`badge ${
                    overdue
                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {fmtDateTime(r.due_at)}
                </span>
                <button onClick={() => del(r.id)} className="btn-ghost px-2 py-1 text-xs">
                  🗑
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
