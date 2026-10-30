import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";
import { canAccessContact } from "@/lib/access";
import { ok, badRequest, handleError } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!(await canAccessContact(user, id))) {
      throw new AuthError("Kein Zugriff auf diesen Kontakt.", 403);
    }
    const { type, summary, occurred_at } = await req.json();
    if (!summary || !String(summary).trim()) {
      return badRequest("Beschreibung erforderlich.");
    }
    const rows = await query(
      `INSERT INTO interactions (contact_id, author_id, type, summary, occurred_at)
       VALUES ($1,$2,$3,$4,COALESCE($5, now())) RETURNING *`,
      [id, user.id, type || "note", String(summary).trim(), occurred_at || null]
    );
    await query(`UPDATE contacts SET updated_at=now() WHERE id=$1`, [id]);
    return ok(rows[0]);
  } catch (err) {
    return handleError(err);
  }
}
