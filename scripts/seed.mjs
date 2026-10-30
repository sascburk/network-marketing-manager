// Optionale Demo-Daten. Nur ausfuehren, wenn gewuenscht:  npm run seed
// Legt ein paar Beispielkontakte, Notizen und Erinnerungen an.
import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL ist nicht gesetzt.");
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString });
  const team = await pool.query(`SELECT id FROM teams LIMIT 1`);
  if (!team.rows.length) {
    console.error("Kein Team gefunden. Zuerst 'npm run create-admin' ausfuehren.");
    process.exit(1);
  }
  const teamId = team.rows[0].id;
  const admin = await pool.query(
    `SELECT id FROM users WHERE team_id = $1 ORDER BY created_at LIMIT 1`,
    [teamId]
  );
  const ownerId = admin.rows[0]?.id ?? null;
  const companies = await pool.query(
    `SELECT id, name FROM companies WHERE team_id = $1`,
    [teamId]
  );
  const byName = (n) => companies.rows.find((c) => c.name.includes(n))?.id ?? null;

  const today = new Date();
  const soon = new Date(today.getTime() + 2 * 86400000);
  const bday = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate() + 3);

  const demo = [
    {
      first: "Anna", last: "Muster", phone: "+41 79 111 22 33",
      email: "anna@example.ch", whatsapp: "+41 79 111 22 33",
      company: byName("aniFit"), status: "Interessent",
      tags: ["Hundebesitzerin", "Messe"], bday,
      note: "An der Messe kennengelernt, interessiert an Hundefutter-Probe.",
    },
    {
      first: "Beat", last: "Keller", phone: "+41 78 222 33 44",
      email: "beat@example.ch", company: byName("Life Plus"),
      status: "Kunde", tags: ["Stammkunde"],
      note: "Bestellt monatlich Omega-3. Sehr zufrieden.",
    },
    {
      first: "Carla", last: "Weber", phone: "+41 76 333 44 55",
      email: "carla@example.ch", company: byName("Mental"),
      status: "Lead", tags: ["Empfehlung"],
      note: "Von Anna empfohlen. Noch kein Kontakt aufgenommen.",
    },
  ];

  for (const d of demo) {
    const c = await pool.query(
      `INSERT INTO contacts (team_id, owner_id, company_id, first_name, last_name,
         phone, email, whatsapp, status, tags, birthday)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [teamId, ownerId, d.company, d.first, d.last, d.phone, d.email,
       d.whatsapp ?? null, d.status, d.tags, d.bday ?? null]
    );
    const cid = c.rows[0].id;
    await pool.query(
      `INSERT INTO notes (contact_id, author_id, body) VALUES ($1,$2,$3)`,
      [cid, ownerId, d.note]
    );
    await pool.query(
      `INSERT INTO interactions (contact_id, author_id, type, summary)
       VALUES ($1,$2,'note',$3)`,
      [cid, ownerId, "Kontakt angelegt (Demo)."]
    );
    await pool.query(
      `INSERT INTO reminders (team_id, contact_id, user_id, title, due_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [teamId, cid, ownerId, `Follow-up mit ${d.first}`, soon.toISOString()]
    );
  }

  console.log("[seed] Demo-Daten angelegt.");
  await pool.end();
}

main().catch((e) => {
  console.error("[seed] Fehler:", e);
  process.exit(1);
});
