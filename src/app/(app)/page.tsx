import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { fmtDate, fmtDateTime, STATUS_BADGE, initials } from "@/lib/format";
import type { ContactStatus } from "@/lib/types";
import PushBanner from "@/components/PushBanner";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const teamId = user.team_id;

  const [
    totalRows,
    byStatus,
    byCompany,
    upcoming,
    birthdays,
    recent,
  ] = await Promise.all([
    query<{ n: number }>(
      `SELECT count(*)::int AS n FROM contacts WHERE team_id=$1`,
      [teamId]
    ),
    query<{ status: ContactStatus; n: number }>(
      `SELECT status, count(*)::int AS n FROM contacts WHERE team_id=$1 GROUP BY status`,
      [teamId]
    ),
    query<{ name: string; color: string; n: number }>(
      `SELECT co.name, co.color, count(c.id)::int AS n
         FROM companies co LEFT JOIN contacts c ON c.company_id=co.id
        WHERE co.team_id=$1 GROUP BY co.id ORDER BY n DESC`,
      [teamId]
    ),
    query<{
      id: string;
      title: string;
      due_at: string;
      first_name: string | null;
      last_name: string | null;
      contact_id: string | null;
    }>(
      `SELECT r.id, r.title, r.due_at, r.contact_id, c.first_name, c.last_name
         FROM reminders r LEFT JOIN contacts c ON c.id=r.contact_id
        WHERE r.team_id=$1 AND r.done=false AND r.due_at <= now() + interval '14 days'
        ORDER BY r.due_at ASC LIMIT 8`,
      [teamId]
    ),
    query<{
      id: string;
      first_name: string;
      last_name: string | null;
      birthday: string;
    }>(
      `SELECT id, first_name, last_name, birthday FROM contacts
        WHERE team_id=$1 AND birthday IS NOT NULL
          AND to_char(birthday,'MM-DD') BETWEEN to_char(now(),'MM-DD')
              AND to_char(now() + interval '30 days','MM-DD')
        ORDER BY to_char(birthday,'MM-DD') ASC LIMIT 8`,
      [teamId]
    ),
    query<{
      id: string;
      first_name: string;
      last_name: string | null;
      status: ContactStatus;
      updated_at: string;
      company_name: string | null;
    }>(
      `SELECT c.id, c.first_name, c.last_name, c.status, c.updated_at, co.name AS company_name
         FROM contacts c LEFT JOIN companies co ON co.id=c.company_id
        WHERE c.team_id=$1 ORDER BY c.updated_at DESC LIMIT 6`,
      [teamId]
    ),
  ]);

  const total = totalRows[0]?.n ?? 0;
  const statusMap = new Map(byStatus.map((r) => [r.status, r.n]));
  const statuses: ContactStatus[] = ["Lead", "Interessent", "Kunde", "Partner"];
  const overdue = upcoming.filter((u) => new Date(u.due_at) < new Date()).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hallo {user.name.split(" ")[0]} 👋</h1>
          <p className="text-sm text-slate-500">Dein Ueberblick fuer heute.</p>
        </div>
        <Link href="/contacts?new=1" className="btn-primary hidden md:inline-flex">
          + Neuer Kontakt
        </Link>
      </div>

      <PushBanner />

      {/* KPI-Karten */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Kontakte gesamt" value={total} icon="👥" href="/contacts" />
        <Kpi
          label="Faellige Follow-ups"
          value={overdue}
          icon="⏰"
          href="/reminders"
          accent={overdue > 0 ? "red" : "default"}
        />
        <Kpi
          label="Kunden"
          value={statusMap.get("Kunde") ?? 0}
          icon="✅"
          href="/contacts?status=Kunde"
        />
        <Kpi
          label="Partner"
          value={statusMap.get("Partner") ?? 0}
          icon="🤝"
          href="/contacts?status=Partner"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline */}
        <div className="card">
          <h2 className="mb-4 font-semibold">Pipeline</h2>
          <div className="space-y-3">
            {statuses.map((s) => {
              const n = statusMap.get(s) ?? 0;
              const pct = total ? Math.round((n / total) * 100) : 0;
              return (
                <Link
                  key={s}
                  href={`/contacts?status=${s}`}
                  className="block"
                >
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className={`badge ${STATUS_BADGE[s]}`}>{s}</span>
                    <span className="text-slate-500">{n}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Nach Firma */}
        <div className="card">
          <h2 className="mb-4 font-semibold">Kontakte nach Firma</h2>
          <div className="space-y-3">
            {byCompany.length === 0 && (
              <p className="text-sm text-slate-500">Noch keine Firmen.</p>
            )}
            {byCompany.map((c) => {
              const pct = total ? Math.round((c.n / total) * 100) : 0;
              return (
                <div key={c.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </span>
                    <span className="text-slate-500">{c.n}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: c.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Anstehende Follow-ups */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Anstehende Follow-ups</h2>
            <Link href="/reminders" className="text-sm text-brand-600">
              Alle
            </Link>
          </div>
          <ul className="space-y-2">
            {upcoming.length === 0 && (
              <li className="text-sm text-slate-500">Keine offenen Follow-ups 🎉</li>
            )}
            {upcoming.map((u) => {
              const due = new Date(u.due_at);
              const isOverdue = due < new Date();
              const body = (
                <>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{u.title}</div>
                    {(u.first_name || u.last_name) && (
                      <div className="truncate text-xs text-slate-500">
                        {u.first_name} {u.last_name}
                      </div>
                    )}
                  </div>
                  <span
                    className={`badge shrink-0 ${
                      isOverdue
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {fmtDate(u.due_at)}
                  </span>
                </>
              );
              return (
                <li key={u.id}>
                  {u.contact_id ? (
                    <Link
                      href={`/contacts/${u.contact_id}`}
                      className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between gap-3 p-2">
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Geburtstage + Aktivitaet */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="mb-4 font-semibold">🎂 Geburtstage (30 Tage)</h2>
            <ul className="space-y-2">
              {birthdays.length === 0 && (
                <li className="text-sm text-slate-500">Keine anstehenden Geburtstage.</li>
              )}
              {birthdays.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/contacts/${b.id}`}
                    className="flex items-center justify-between rounded-xl p-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span>
                      {b.first_name} {b.last_name}
                    </span>
                    <span className="text-slate-500">{fmtDate(b.birthday)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2 className="mb-4 font-semibold">Letzte Aktivitaet</h2>
            <ul className="space-y-2">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/contacts/${r.id}`}
                    className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      {initials(r.first_name, r.last_name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {r.first_name} {r.last_name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {r.company_name ?? "—"} · {fmtDateTime(r.updated_at)}
                      </span>
                    </span>
                    <span className={`badge ${STATUS_BADGE[r.status]}`}>
                      {r.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  href,
  accent = "default",
}: {
  label: string;
  value: number;
  icon: string;
  href: string;
  accent?: "default" | "red";
}) {
  return (
    <Link href={href} className="card transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
        <span
          className={`text-3xl font-bold ${
            accent === "red" && value > 0 ? "text-red-600" : ""
          }`}
        >
          {value}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-500">{label}</p>
    </Link>
  );
}
