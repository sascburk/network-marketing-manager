"use client";
import { useEffect, useState } from "react";
import {
  pushSupported,
  isIos,
  isStandalone,
  getSubscription,
  subscribePush,
} from "@/lib/push-client";

// Hinweis-Banner auf dem Dashboard: fuehrt iPhone-Nutzer durch die Installation
// und bietet das Aktivieren der Benachrichtigungen an.
export default function PushBanner() {
  const [state, setState] = useState<
    "loading" | "subscribed" | "need-install" | "can-enable" | "unsupported"
  >("loading");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      if (!pushSupported()) {
        // iOS unterstuetzt Push nur als installierte PWA.
        if (isIos() && !isStandalone()) setState("need-install");
        else setState("unsupported");
        return;
      }
      const sub = await getSubscription();
      if (sub) setState("subscribed");
      else if (isIos() && !isStandalone()) setState("need-install");
      else setState("can-enable");
    })();
  }, []);

  useEffect(() => {
    setDismissed(sessionStorage.getItem("push-banner-dismissed") === "1");
  }, []);

  async function enable() {
    setBusy(true);
    setMsg("");
    const res = await subscribePush();
    setBusy(false);
    if (res.ok) {
      setState("subscribed");
    } else {
      setMsg(res.error || "Fehler beim Aktivieren.");
    }
  }

  if (state === "loading" || state === "subscribed" || state === "unsupported")
    return null;
  if (dismissed) return null;

  function dismiss() {
    sessionStorage.setItem("push-banner-dismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="card border-brand-200 bg-brand-50 dark:border-brand-900/50 dark:bg-brand-900/20">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>
          🔔
        </span>
        <div className="flex-1">
          {state === "need-install" ? (
            <>
              <p className="font-semibold">
                Benachrichtigungen auf dem iPhone aktivieren
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Damit Push auf dem iPhone funktioniert, musst du die App zuerst
                installieren: In Safari unten auf <b>Teilen</b> tippen →{" "}
                <b>„Zum Home-Bildschirm“</b>. Danach die App vom Home-Bildschirm
                oeffnen und hier die Benachrichtigungen einschalten.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">Benachrichtigungen aktivieren</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Erhalte Push-Erinnerungen fuer faellige Follow-ups und
                Geburtstage – auch wenn die App geschlossen ist.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={enable}
                  className="btn-primary"
                  disabled={busy}
                >
                  {busy ? "Aktiviere…" : "Jetzt aktivieren"}
                </button>
              </div>
              {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
            </>
          )}
        </div>
        <button
          onClick={dismiss}
          className="btn-ghost px-2 py-1 text-xs"
          aria-label="Ausblenden"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
