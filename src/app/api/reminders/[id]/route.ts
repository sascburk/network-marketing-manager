import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, handleError } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const b = await req.json();
    // Erledigt-Status umschalten und/oder bearbeiten.
    const rows = await query(
      `UPDATE reminders SET
         done = COALESCE($1, done),
         title = COALESCE($2, title),
         due_at = COALESCE($3, due_at),
         notified = CASE WHEN $3 IS NOT NULL THEN false ELSE notified END
       WHERE id = $4 AND team_id = $5 RETURNING *`,
      [
        typeof b.done === "boolean" ? b.done : null,
        b.title ? String(b.title).trim() : null,
        b.due_at || null,
        id,
        user.team_id,
      ]
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
    const user = await requireUser();
    const { id } = await params;
    await query(`DELETE FROM reminders WHERE id=$1 AND team_id=$2`, [
      id,
      user.team_id,
    ]);
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
