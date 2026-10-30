import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { ok, badRequest, handleError } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const b = await req.json();
    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    if (typeof b.name === "string" && b.name.trim()) {
      sets.push(`name = $${i++}`);
      vals.push(b.name.trim());
    }
    if (b.role === "admin" || b.role === "member") {
      sets.push(`role = $${i++}`);
      vals.push(b.role);
    }
    if (typeof b.active === "boolean") {
      sets.push(`active = $${i++}`);
      vals.push(b.active);
    }
    if (typeof b.password === "string" && b.password) {
      if (b.password.length < 8) return badRequest("Passwort zu kurz (min. 8).");
      sets.push(`password_hash = $${i++}`);
      vals.push(await hashPassword(b.password));
    }
    if (!sets.length) return badRequest("Keine Aenderungen.");
    vals.push(id, admin.team_id);
    const rows = await query(
      `UPDATE users SET ${sets.join(", ")} WHERE id=$${i++} AND team_id=$${i}
       RETURNING id, email, name, role, active, created_at`,
      vals
    );
    return ok(rows[0] ?? null);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (id === admin.id) {
      return badRequest("Sie koennen sich nicht selbst loeschen.");
    }
    await query(`DELETE FROM users WHERE id=$1 AND team_id=$2`, [
      id,
      admin.team_id,
    ]);
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
