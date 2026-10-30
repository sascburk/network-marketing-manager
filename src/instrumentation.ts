// Wird von Next.js einmal beim Serverstart ausgefuehrt (Node-Runtime).
// Startet den eingebauten Erinnerungs-Scheduler, falls aktiviert.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./lib/scheduler");
    startScheduler();
  }
}
