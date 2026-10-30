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
    const { body } = await req.json();
    if (!body || !String(body).trim()) return badRequest("Notiz ist leer.");
    const rows = await query(
      `INSERT INTO notes (contact_id, author_id, body) VALUES ($1,$2,$3) RETURNING *`,
      [id, user.id, String(body).trim()]
    );
    await query(`UPDATE contacts SET updated_at=now() WHERE id=$1`, [id]);
    return ok(rows[0]);
  } catch (err) {
    return handleError(err);
  }
}
