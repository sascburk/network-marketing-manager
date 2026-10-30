"use client";
import { useEffect } from "react";

// Registriert den Service Worker (noetig fuer Installierbarkeit + Push).
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignorieren */
      });
    }
  }, []);
  return null;
}
