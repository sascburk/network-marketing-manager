"use client";
import { useEffect, useState } from "react";
import {
  pushSupported,
  isIos,
  isStandalone,
  getSubscription,
  subscribePush,
  unsubscribePush,
} from "@/lib/push-client";

export default function SettingsPage() {
  // ---- Ollama ----
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [testOk, setTestOk] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);

  // ---- Push ----
  const [pushState, setPushState] = useState<
    "loading" | "on" | "off" | "need-install" | "unsupported"
  >("loading");
  const [pushMsg, setPushMsg] = useState("");
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setBaseUrl(d.ollama?.baseUrl ?? "");
        setModel(d.ollama?.model ?? "");
        setLoaded(true);
      });
    (async () => {
      if (!pushSupported()) {
        setPushState(isIos() && !isStandalone() ? "need-install" : "unsupported");
        return;
      }
      const sub = await getSubscription();
      setPushState(sub ? "on" : "off");
    })();
  }, []);

  async function saveOllama() {
    setSavedMsg("");
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ollama_base_url: baseUrl, ollama_model: model }),
    });
    if (res.ok) setSavedMsg("Gespeichert ✓");
    else setSavedMsg("Fehler beim Speichern.");
    setTimeout(() => setSavedMsg(""), 2500);
  }

  async function testOllama() {
    setTesting(true);
    setTestMsg("");
    setTestOk(null);
    // Erst speichern, damit der Test die aktuellen Werte nutzt.
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ollama_base_url: baseUrl, ollama_model: model }),
    });
    const res = await fetch("/api/ollama/test", { method: "POST" });
    const d = await res.json();
    setTesting(false);
    setTestOk(d.ok ?? false);
    setTestMsg(d.message || d.error || "Unbekanntes Ergebnis.");
  }

  async function togglePush(enable: boolean) {
    setPushBusy(true);
    setPushMsg("");
    if (enable) {
      const res = await subscribePush();
      if (res.ok) setPushState("on");
      else setPushMsg(res.error || "Fehler.");
    } else {
      await unsubscribePush();
      setPushState("off");
    }
    setPushBusy(false);
  }

  async function testPush() {
    setPushMsg("");
    const res = await fetch("/api/push/test", { method: "POST" });
    const d = await res.json();
    setPushMsg(res.ok ? "Test-Benachrichtigung gesendet ✓" : d.error || "Fehler.");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Einstellungen</h1>

      {/* Ollama */}
      <div className="card space-y-4">
        <div>
          <h2 className="font-semibold">🤖 KI (Ollama)</h2>
          <p className="text-xs text-slate-500">
            Verbindung zu deinem lokalen Ollama-Server. Die App ruft den Server
            serverseitig auf.
          </p>
        </div>
        <div>
          <label className="label">Ollama Basis-URL</label>
          <input
            className="input"
            placeholder="http://192.168.1.100:11434"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            disabled={!loaded}
          />
        </div>
        <div>
          <label className="label">Standard-Modell</label>
          <input
            className="input"
            placeholder="llama3.1"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!loaded}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-primary" onClick={saveOllama}>
            Speichern
          </button>
          <button className="btn-secondary" onClick={testOllama} disabled={testing}>
            {testing ? "Teste…" : "KI-Verbindung testen"}
          </button>
          {savedMsg && <span className="text-sm text-emerald-600">{savedMsg}</span>}
        </div>
        {testMsg && (
          <p
            className={`rounded-xl px-3 py-2 text-sm ${
              testOk
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            }`}
          >
            {testMsg}
          </p>
        )}
      </div>

      {/* Push */}
      <div className="card space-y-4">
        <div>
          <h2 className="font-semibold">🔔 Benachrichtigungen</h2>
          <p className="text-xs text-slate-500">
            Push-Erinnerungen fuer faellige Follow-ups und Geburtstage.
          </p>
        </div>

        {pushState === "loading" && <p className="text-sm text-slate-500">Lade…</p>}

        {pushState === "need-install" && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Auf dem iPhone/iPad musst du die App zuerst installieren: In Safari auf{" "}
            <b>Teilen</b> → <b>„Zum Home-Bildschirm“</b>. Danach die App vom
            Home-Bildschirm oeffnen und hier aktivieren.
          </p>
        )}

        {pushState === "unsupported" && (
          <p className="text-sm text-slate-500">
            Dieses Geraet/Browser unterstuetzt keine Web-Push-Benachrichtigungen.
          </p>
        )}

        {(pushState === "on" || pushState === "off") && (
          <div className="flex flex-wrap items-center gap-2">
            {pushState === "off" ? (
              <button
                className="btn-primary"
                onClick={() => togglePush(true)}
                disabled={pushBusy}
              >
                {pushBusy ? "Aktiviere…" : "Benachrichtigungen aktivieren"}
              </button>
            ) : (
              <>
                <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Aktiv
                </span>
                <button className="btn-secondary" onClick={testPush}>
                  Test-Benachrichtigung senden
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => togglePush(false)}
                  disabled={pushBusy}
                >
                  Deaktivieren
                </button>
              </>
            )}
          </div>
        )}
        {pushMsg && <p className="text-sm text-slate-600 dark:text-slate-300">{pushMsg}</p>}
      </div>
    </div>
  );
}
