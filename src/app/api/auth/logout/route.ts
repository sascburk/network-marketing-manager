import { destroySession } from "@/lib/auth";
import { ok, handleError } from "@/lib/api";

export async function POST() {
  try {
    await destroySession();
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
