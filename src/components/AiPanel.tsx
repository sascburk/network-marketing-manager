"use client";
import { useState } from "react";

export default function AiPanel({ contactId }: { contactId: string }) {
  const [tab, setTab] = useState<"message" | "summary" | "next-action">("message");
  const [channel, setChannel] = useState("WhatsApp");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function run(action: "message" | "summary" | "next-action") {
    setTab(action);
    setBusy(true);
    setError("");
    setResult("");
    setCopied(false);
    try {
      const res = await fetch(`/api/ollama/contact/${contactId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, channel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "KI-Anfrage fehlgeschlagen.");
        return;
      }
      setResult(data.text || "(leere Antwort)");
    } catch {
      setError("Netzwerkfehler bei der KI-Anfrage.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card">
      <h2 className="mb-1 flex items-center gap-2 font-semibold">
        ✨ KI-Assistent
      </h2>
      <p className="mb-3 text-xs text-slate-500">
        Nutzt deinen lokalen Ollama-Server (in den Einstellungen konfigurierbar).
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          className={tab === "message" ? "btn-primary" : "btn-secondary"}
          onClick={() => run("message")}
          disabled={busy}
        >
          Nachricht vorschlagen
        </button>
        <button
          className={tab === "summary" ? "btn-primary" : "btn-secondary"}
          onClick={() => run("summary")}
          disabled={busy}
        >
          Zusammenfassen
        </button>
        <button
          className={tab === "next-action" ? "btn-primary" : "btn-secondary"}
          onClick={() => run("next-action")}
          disabled={busy}
        >
          Naechste Aktion
        </button>
      </div>

      {tab === "message" && (
        <div className="mb-3">
          <label className="label">Kanal</label>
          <select
            className="input"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            <option>WhatsApp</option>
            <option>SMS</option>
            <option>E-Mail</option>
            <option>Telefon-Gespraechsleitfaden</option>
          </select>
        </div>
      )}

      {busy && (
        <p className="text-sm text-slate-500">KI denkt nach… (kann einige Sekunden dauern)</p>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      {result && (
        <div className="space-y-2">
          <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
            {result}
          </div>
          <button className="btn-secondary" onClick={copy}>
            {copied ? "Kopiert ✓" : "In Zwischenablage kopieren"}
          </button>
        </div>
      )}
    </div>
  );
}
