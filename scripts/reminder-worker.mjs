// Optionaler externer Worker: ruft den geschuetzten Cron-Endpunkt der App auf.
// Nutze dies statt des eingebauten Schedulers (ENABLE_SCHEDULER=false),
// z.B. per System-Cron:  */15 * * * * node /pfad/scripts/reminder-worker.mjs
const url = process.env.APP_URL || "http://localhost:3000";
const secret = process.env.SESSION_SECRET || "";

const res = await fetch(`${url.replace(/\/$/, "")}/api/cron/run`, {
  method: "POST",
  headers: { "x-cron-secret": secret },
});
const text = await res.text();
console.log(`[worker] Status ${res.status}: ${text}`);
if (!res.ok) process.exit(1);
