import { NextRequest } from "next/server";
import { queryOne } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { ok, badRequest, handleError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return badRequest("E-Mail und Passwort erforderlich.");
    }
    const user = await queryOne<{
      id: string;
      password_hash: string;
      active: boolean;
    }>(`SELECT id, password_hash, active FROM users WHERE email = $1`, [
      String(email).toLowerCase().trim(),
    ]);
    if (!user || !user.active) {
      return badRequest("E-Mail oder Passwort falsch.");
    }
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return badRequest("E-Mail oder Passwort falsch.");
    }
    await createSession(user.id);
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
