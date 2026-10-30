"use client";
import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { fmtDate } from "@/lib/format";

interface U {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member";
  active: boolean;
  created_at: string;
}

export default function AdminUsers({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<U[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [edit, setEdit] = useState<U | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    const d = await res.json();
    setUsers(Array.isArray(d) ? d : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function del(id: string) {
    if (!confirm("Benutzer wirklich loeschen?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "Fehler.");
    }
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Benutzer</h1>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          + Benutzer
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Lade…</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="card flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {u.name}{" "}
                  {u.id === currentUserId && (
                    <span className="text-xs text-slate-400">(du)</span>
                  )}
                </p>
                <p className="text-xs text-slate-500">{u.email}</p>
              </div>
              <span
                className={`badge ${
                  u.role === "admin"
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {u.role === "admin" ? "Admin" : "Mitglied"}
              </span>
              {!u.active && (
                <span className="badge bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                  Inaktiv
                </span>
              )}
              <span className="text-xs text-slate-400">seit {fmtDate(u.created_at)}</span>
              <button className="btn-secondary" onClick={() => setEdit(u)}>
                Bearbeiten
              </button>
              {u.id !== currentUserId && (
                <button className="btn-ghost" onClick={() => del(u.id)}>
                  🗑
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <UserModal
          onClose={() => setShowNew(false)}
          onSaved={() => {
            setShowNew(false);
            load();
          }}
        />
      )}
      {edit && (
        <UserModal
          user={edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function UserModal({
  user,
  onClose,
  onSaved,
}: {
  user?: U;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "member">(user?.role ?? "member");
  const [active, setActive] = useState(user?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    if (!name.trim()) return setError("Name erforderlich.");
    if (!user && (!email.trim() || !password)) {
      return setError("E-Mail und Passwort erforderlich.");
    }
    setBusy(true);
    let res: Response;
    if (user) {
      const body: Record<string, unknown> = { name, role, active };
      if (password) body.password = password;
      res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
    }
    setBusy(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Fehler.");
      return;
    }
    onSaved();
  }

  return (
    <Modal title={user ? "Benutzer bearbeiten" : "Neuer Benutzer"} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">E-Mail</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!user}
          />
        </div>
        <div>
          <label className="label">
            {user ? "Neues Passwort (leer lassen = unveraendert)" : "Passwort (min. 8 Zeichen)"}
          </label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="label">Rolle</label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "member")}
            >
              <option value="member">Mitglied</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {user && (
            <label className="mt-6 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Aktiv
            </label>
          )}
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
