"use client";
import { useEffect, useState } from "react";

type Mode = "auto" | "light" | "dark";

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("auto");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Mode) || "auto";
    setMode(stored);
  }, []);

  function apply(next: Mode) {
    setMode(next);
    localStorage.setItem("theme", next);
    const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = next === "dark" || (next === "auto" && sysDark);
    document.documentElement.classList.toggle("dark", dark);
  }

  const options: { value: Mode; label: string; icon: string }[] = [
    { value: "auto", label: "Auto", icon: "🌓" },
    { value: "light", label: "Hell", icon: "☀️" },
    { value: "dark", label: "Dunkel", icon: "🌙" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-1 dark:border-slate-700">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => apply(o.value)}
          title={o.label}
          className={`rounded-lg px-2 py-1 text-xs transition ${
            mode === o.value
              ? "bg-brand-600 text-white"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <span aria-hidden>{o.icon}</span>
          <span className="sr-only">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
