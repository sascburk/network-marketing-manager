import { NextRequest } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canAccessContact } from "@/lib/access";
import { ok, badRequest, handleError } from "@/lib/api";
import { AuthError } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!(await canAccessContact(user, id))) {
      throw new AuthError("Kein Zugriff auf diesen Kontakt.", 403);
    }
    const contact = await queryOne(
      `SELECT c.*, co.name AS company_name, co.color AS company_color,
              u.name AS owner_name
         FROM contacts c
         LEFT JOIN companies co ON co.id = c.company_id
         LEFT JOIN users u ON u.id = c.owner_id
        WHERE c.id = $1`,
      [id]
    );
    const notes = await query(
      `SELECT n.*, u.name AS author_name FROM notes n
         LEFT JOIN users u ON u.id = n.author_id
        WHERE n.contact_id = $1 ORDER BY n.created_at DESC`,
      [id]
    );
    const interactions = await query(
      `SELECT i.*, u.name AS author_name FROM interactions i
         LEFT JOIN users u ON u.id = i.author_id
        WHERE i.contact_id = $1 ORDER BY i.occurred_at DESC`,
      [id]
    );
    const reminders = await query(
      `SELECT * FROM reminders WHERE contact_id = $1 ORDER BY due_at ASC`,
      [id]
    );
    const shares = await query(
      `SELECT cs.user_id, u.name FROM contact_shares cs
         JOIN users u ON u.id = cs.user_id WHERE cs.contact_id = $1`,
      [id]
    );
    return ok({ contact, notes, interactions, reminders, shares });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!(await canAccessContact(user, id))) {
      throw new AuthError("Kein Zugriff auf diesen Kontakt.", 403);
    }
    const b = await req.json();
    if (!b.first_name || !String(b.first_name).trim()) {
      return badRequest("Vorname erforderlich.");
    }
    const rows = await query(
      `UPDATE contacts SET
         company_id=$1, first_name=$2, last_name=$3, phone=$4, email=$5,
         whatsapp=$6, address=$7, birthday=$8, status=$9, tags=$10,
         owner_id=COALESCE($11, owner_id), updated_at=now()
       WHERE id=$12 RETURNING *`,
      [
        b.company_id || null,
        String(b.first_name).trim(),
        b.last_name || null,
        b.phone || null,
        b.email || null,
        b.whatsapp || null,
        b.address || null,
        b.birthday || null,
        b.status || "Lead",
        Array.isArray(b.tags) ? b.tags : [],
        b.owner_id || null,
        id,
      ]
    );
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
    if (!(await canAccessContact(user, id))) {
      throw new AuthError("Kein Zugriff auf diesen Kontakt.", 403);
    }
    await query(`DELETE FROM contacts WHERE id=$1`, [id]);
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
