import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, badRequest, handleError } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { name, color, notes } = await req.json();
    if (!name || !String(name).trim()) return badRequest("Name erforderlich.");
    const rows = await query(
      `UPDATE companies SET name=$1, color=$2, notes=$3
         WHERE id=$4 AND team_id=$5 RETURNING *`,
      [String(name).trim(), color || "#3270f6", notes || null, id, user.team_id]
    );
    if (!rows.length) return badRequest("Firma nicht gefunden.");
    return ok(rows[0]);
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
    await query(`DELETE FROM companies WHERE id=$1 AND team_id=$2`, [
      id,
      user.team_id,
    ]);
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
