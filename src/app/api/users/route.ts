import { NextRequest } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireUser, requireAdmin, hashPassword } from "@/lib/auth";
import { ok, badRequest, handleError } from "@/lib/api";

// GET: Team-Mitglieder. Fuer Zuweisung/Freigabe brauchen auch Mitglieder die Liste.
export async function GET() {
  try {
    const user = await requireUser();
    const rows = await query(
      `SELECT id, email, name, role, active, created_at
         FROM users WHERE team_id = $1 ORDER BY name`,
      [user.team_id]
    );
    return ok(rows);
  } catch (err) {
    return handleError(err);
  }
}

// POST: neuen Benutzer anlegen (nur Admin).
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { email, name, password, role } = await req.json();
    if (!email || !name || !password) {
      return badRequest("E-Mail, Name und Passwort erforderlich.");
    }
    if (String(password).length < 8) {
      return badRequest("Passwort muss mindestens 8 Zeichen haben.");
    }
    const existing = await queryOne(`SELECT id FROM users WHERE email=$1`, [
      String(email).toLowerCase().trim(),
    ]);
    if (existing) return badRequest("E-Mail ist bereits vergeben.");
    const hash = await hashPassword(password);
    const rows = await query(
      `INSERT INTO users (team_id, email, name, password_hash, role, active)
       VALUES ($1,$2,$3,$4,$5,true)
       RETURNING id, email, name, role, active, created_at`,
      [
        admin.team_id,
        String(email).toLowerCase().trim(),
        String(name).trim(),
        hash,
        role === "admin" ? "admin" : "member",
      ]
    );
    return ok(rows[0]);
  } catch (err) {
    return handleError(err);
  }
}
