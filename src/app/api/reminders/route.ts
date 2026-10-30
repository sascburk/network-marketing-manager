import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, badRequest, handleError } from "@/lib/api";

// GET: offene/alle Erinnerungen des Teams, die den Nutzer betreffen.
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const sp = req.nextUrl.searchParams;
    const includeDone = sp.get("done") === "1";
    const rows = await query(
      `SELECT r.*, c.first_name, c.last_name, co.name AS company_name
         FROM reminders r
         LEFT JOIN contacts c ON c.id = r.contact_id
         LEFT JOIN companies co ON co.id = c.company_id
        WHERE r.team_id = $1
          AND ($3 = 'admin' OR r.user_id = $2 OR c.owner_id = $2
               OR EXISTS (SELECT 1 FROM contact_shares cs WHERE cs.contact_id = c.id AND cs.user_id = $2))
          ${includeDone ? "" : "AND r.done = false"}
        ORDER BY r.due_at ASC`,
      [user.team_id, user.id, user.role]
    );
    return ok(rows);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { contact_id, title, due_at } = await req.json();
    if (!title || !String(title).trim()) return badRequest("Titel erforderlich.");
    if (!due_at) return badRequest("Faelligkeitsdatum erforderlich.");
    const rows = await query(
      `INSERT INTO reminders (team_id, contact_id, user_id, title, due_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [user.team_id, contact_id || null, user.id, String(title).trim(), due_at]
    );
    return ok(rows[0]);
  } catch (err) {
    return handleError(err);
  }
}
