import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, handleError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { endpoint } = await req.json();
    if (endpoint) {
      await query(
        `DELETE FROM push_subscriptions WHERE endpoint=$1 AND user_id=$2`,
        [endpoint, user.id]
      );
    }
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
