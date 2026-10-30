import "server-only";
import { query } from "./db";
import { sendPushToUser } from "./push";

/**
 * Prueft faellige Follow-up-Erinnerungen und anstehende Geburtstage und
 * sendet dafuer Web-Push-Benachrichtigungen. Idempotent: bereits versendete
 * Erinnerungen werden per Flag (notified) bzw. birthday_notifications
 * ausgeschlossen.
 */
export async function processDueNotifications(): Promise<{
  reminders: number;
  birthdays: number;
}> {
  let reminders = 0;
  let birthdays = 0;

  // ---- Faellige Follow-ups (due_at <= jetzt, nicht erledigt, noch nicht benachrichtigt)
  const dueReminders = await query<{
    id: string;
    title: string;
    contact_id: string | null;
    owner_id: string | null;
    reminder_user: string | null;
    shared: string[] | null;
  }>(
    `SELECT r.id, r.title, r.contact_id, c.owner_id,
            r.user_id AS reminder_user,
            COALESCE(array_agg(cs.user_id) FILTER (WHERE cs.user_id IS NOT NULL), '{}') AS shared
       FROM reminders r
       LEFT JOIN contacts c ON c.id = r.contact_id
       LEFT JOIN contact_shares cs ON cs.contact_id = c.id
      WHERE r.done = false AND r.notified = false AND r.due_at <= now()
      GROUP BY r.id, c.owner_id`
  );

  for (const r of dueReminders) {
    const recipients = new Set<string>();
    if (r.reminder_user) recipients.add(r.reminder_user);
    if (r.owner_id) recipients.add(r.owner_id);
    for (const u of r.shared ?? []) recipients.add(u);
    for (const uid of recipients) {
      try {
        await sendPushToUser(uid, {
          title: "Follow-up faellig",
          body: r.title,
          url: r.contact_id ? `/contacts/${r.contact_id}` : "/reminders",
          tag: `reminder-${r.id}`,
        });
      } catch {
        /* VAPID evtl. nicht konfiguriert -> ignorieren */
      }
    }
    await query(`UPDATE reminders SET notified = true WHERE id = $1`, [r.id]);
    reminders++;
  }

  // ---- Geburtstage heute
  const year = new Date().getFullYear();
  const bdayContacts = await query<{
    id: string;
    first_name: string;
    last_name: string | null;
    owner_id: string | null;
    shared: string[] | null;
  }>(
    `SELECT c.id, c.first_name, c.last_name, c.owner_id,
            COALESCE(array_agg(cs.user_id) FILTER (WHERE cs.user_id IS NOT NULL), '{}') AS shared
       FROM contacts c
       LEFT JOIN contact_shares cs ON cs.contact_id = c.id
      WHERE c.birthday IS NOT NULL
        AND EXTRACT(MONTH FROM c.birthday) = EXTRACT(MONTH FROM now())
        AND EXTRACT(DAY FROM c.birthday) = EXTRACT(DAY FROM now())
        AND NOT EXISTS (
          SELECT 1 FROM birthday_notifications bn
           WHERE bn.contact_id = c.id AND bn.year = $1
        )
      GROUP BY c.id`,
    [year]
  );

  for (const c of bdayContacts) {
    const name = `${c.first_name} ${c.last_name ?? ""}`.trim();
    const recipients = new Set<string>();
    if (c.owner_id) recipients.add(c.owner_id);
    for (const u of c.shared ?? []) recipients.add(u);
    for (const uid of recipients) {
      try {
        await sendPushToUser(uid, {
          title: "Geburtstag heute!",
          body: `${name} hat heute Geburtstag.`,
          url: `/contacts/${c.id}`,
          tag: `birthday-${c.id}-${year}`,
        });
      } catch {
        /* ignorieren */
      }
    }
    await query(
      `INSERT INTO birthday_notifications (contact_id, year) VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
      [c.id, year]
    );
    birthdays++;
  }

  return { reminders, birthdays };
}

// ---- In-App-Scheduler (startet einmal pro Prozess via instrumentation.ts) ----
declare global {
  // eslint-disable-next-line no-var
  var _schedulerStarted: boolean | undefined;
}

export function startScheduler(): void {
  if (global._schedulerStarted) return;
  if (process.env.ENABLE_SCHEDULER !== "true") return;
  global._schedulerStarted = true;
  const minutes = Number(process.env.SCHEDULER_INTERVAL_MINUTES || "15");
  const intervalMs = Math.max(1, minutes) * 60_000;
  console.log(
    `[scheduler] Erinnerungs-Scheduler aktiv (alle ${minutes} Min.).`
  );
  const run = () => {
    processDueNotifications()
      .then((r) => {
        if (r.reminders || r.birthdays) {
          console.log(
            `[scheduler] ${r.reminders} Follow-up(s), ${r.birthdays} Geburtstag(e) benachrichtigt.`
          );
        }
      })
      .catch((e) => console.error("[scheduler] Fehler:", e));
  };
  // Erster Lauf leicht verzoegert, damit DB sicher bereit ist.
  setTimeout(run, 20_000);
  setInterval(run, intervalMs);
}
