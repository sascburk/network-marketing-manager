"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

interface Props {
  user: { name: string; role: string };
  children: React.ReactNode;
}

const NAV = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/contacts", label: "Kontakte", icon: "👥" },
  { href: "/reminders", label: "Follow-ups", icon: "⏰" },
  { href: "/companies", label: "Firmen", icon: "🏢" },
  { href: "/settings", label: "Einstellungen", icon: "⚙️" },
];

export default function NavShell({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const nav = [...NAV];
  if (user.role === "admin") {
    nav.push({ href: "/admin", label: "Benutzer", icon: "🔐" });
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex md:flex-col">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
            BC
          </div>
          <span className="font-bold">Burkard CRM</span>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive(n.href)
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <span aria-hidden>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <ThemeToggle />
          <div className="px-1 text-xs text-slate-500">
            Angemeldet als
            <div className="font-medium text-slate-700 dark:text-slate-200">
              {user.name}
            </div>
          </div>
          <button onClick={logout} className="btn-secondary w-full">
            Abmelden
          </button>
        </div>
      </aside>

      {/* Hauptbereich */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Topbar (Mobile) */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
              BC
            </div>
            <span className="font-bold">Burkard CRM</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={logout} className="btn-ghost px-2 py-1 text-xs">
              Abmelden
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">{children}</main>

        {/* Bottom-Nav (Mobile) */}
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
          {nav.slice(0, 5).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                isActive(n.href)
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-slate-500"
              }`}
            >
              <span className="text-lg" aria-hidden>
                {n.icon}
              </span>
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
