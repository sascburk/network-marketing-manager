import { NextRequest } from "next/server";
import { processDueNotifications } from "@/lib/scheduler";
import { ok, handleError } from "@/lib/api";
import { NextResponse } from "next/server";

// Externer Cron-Endpunkt (Alternative zum eingebauten Scheduler).
// Schutz ueber Header x-cron-secret == SESSION_SECRET.
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-cron-secret");
    if (!process.env.SESSION_SECRET || secret !== process.env.SESSION_SECRET) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
    }
    const result = await processDueNotifications();
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
