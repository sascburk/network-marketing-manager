import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, badRequest, handleError } from "@/lib/api";

// Sichtbarkeit: Admin sieht alle Team-Kontakte; Mitglied sieht eigene +
// geteilte Kontakte. Filter: scope=mine|shared|all, company, status, q (Suche).
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const sp = req.nextUrl.searchParams;
    const scope = sp.get("scope") || "all";
    const company = sp.get("company");
    const status = sp.get("status");
    const q = sp.get("q");

    const params: unknown[] = [user.team_id, user.id, user.role];
    let where = `c.team_id = $1`;

    // Basis-Sichtbarkeit
    where += ` AND ($3 = 'admin' OR c.owner_id = $2 OR EXISTS (
        SELECT 1 FROM contact_shares cs WHERE cs.contact_id = c.id AND cs.user_id = $2))`;

    if (scope === "mine") {
      params.push(user.id);
      where += ` AND c.owner_id = $${params.length}`;
    } else if (scope === "shared") {
      params.push(user.id);
      where += ` AND EXISTS (SELECT 1 FROM contact_shares cs WHERE cs.contact_id = c.id AND cs.user_id = $${params.length})`;
    }
    if (company) {
      params.push(company);
      where += ` AND c.company_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      where += ` AND c.status = $${params.length}`;
    }
    if (q) {
      params.push(`%${q}%`);
      where += ` AND (c.first_name ILIKE $${params.length} OR c.last_name ILIKE $${params.length}
                  OR c.email ILIKE $${params.length} OR c.phone ILIKE $${params.length})`;
    }

    const rows = await query(
      `SELECT c.*, co.name AS company_name, co.color AS company_color,
              u.name AS owner_name
         FROM contacts c
         LEFT JOIN companies co ON co.id = c.company_id
         LEFT JOIN users u ON u.id = c.owner_id
        WHERE ${where}
        ORDER BY c.updated_at DESC`,
      params
    );
    return ok(rows);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const b = await req.json();
    if (!b.first_name || !String(b.first_name).trim()) {
      return badRequest("Vorname erforderlich.");
    }
    const rows = await query(
      `INSERT INTO contacts
         (team_id, owner_id, company_id, first_name, last_name, phone, email,
          whatsapp, address, birthday, status, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        user.team_id,
        user.id,
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
      ]
    );
    return ok(rows[0]);
  } catch (err) {
    return handleError(err);
  }
}
