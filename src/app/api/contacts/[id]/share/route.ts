import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";
import { canAccessContact } from "@/lib/access";
import { ok, handleError } from "@/lib/api";

// Body: { userIds: string[] }  -> setzt die komplette Freigabeliste.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!(await canAccessContact(user, id))) {
      throw new AuthError("Kein Zugriff auf diesen Kontakt.", 403);
    }
    const { userIds } = await req.json();
    const ids: string[] = Array.isArray(userIds) ? userIds : [];
    await query(`DELETE FROM contact_shares WHERE contact_id=$1`, [id]);
    for (const uid of ids) {
      await query(
        `INSERT INTO contact_shares (contact_id, user_id) VALUES ($1,$2)
           ON CONFLICT DO NOTHING`,
        [id, uid]
      );
    }
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
