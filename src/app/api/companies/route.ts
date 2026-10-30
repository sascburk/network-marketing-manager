import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, badRequest, handleError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await query(
      `SELECT c.*, (SELECT count(*)::int FROM contacts ct WHERE ct.company_id = c.id) AS contact_count
         FROM companies c WHERE c.team_id = $1 ORDER BY c.name`,
      [user.team_id]
    );
    return ok(rows);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { name, color, notes } = await req.json();
    if (!name || !String(name).trim()) return badRequest("Name erforderlich.");
    const rows = await query(
      `INSERT INTO companies (team_id, name, color, notes) VALUES ($1,$2,$3,$4) RETURNING *`,
      [user.team_id, String(name).trim(), color || "#3270f6", notes || null]
    );
    return ok(rows[0]);
  } catch (err) {
    return handleError(err);
  }
}
