import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, badRequest, handleError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const sub = await req.json();
    const endpoint = sub?.endpoint;
    const p256dh = sub?.keys?.p256dh;
    const auth = sub?.keys?.auth;
    if (!endpoint || !p256dh || !auth) {
      return badRequest("Ungueltiges Push-Abo.");
    }
    await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (endpoint) DO UPDATE SET user_id=EXCLUDED.user_id,
         p256dh=EXCLUDED.p256dh, auth=EXCLUDED.auth`,
      [user.id, endpoint, p256dh, auth]
    );
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
