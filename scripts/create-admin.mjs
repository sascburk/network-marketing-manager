// Legt den ersten Admin-Benutzer + Team + Standard-Firmen an.
// Nutzt ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME aus der Umgebung, oder
// Argumente:  node scripts/create-admin.mjs <email> <passwort> "<name>"
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const email = process.argv[2] || process.env.ADMIN_EMAIL;
const password = process.argv[3] || process.env.ADMIN_PASSWORD;
const name = process.argv[4] || process.env.ADMIN_NAME || "Admin";

if (!email || !password) {
  console.error(
    "Benoetigt: ADMIN_EMAIL und ADMIN_PASSWORD (oder als Argumente)."
  );
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL ist nicht gesetzt.");
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString });

  const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [
    email.toLowerCase(),
  ]);
  if (existing.rows.length) {
    console.log(`[create-admin] Benutzer ${email} existiert bereits.`);
    await pool.end();
    return;
  }

  // Team holen oder anlegen.
  let team = await pool.query(`SELECT id FROM teams LIMIT 1`);
  let teamId;
  if (team.rows.length) {
    teamId = team.rows[0].id;
  } else {
    const t = await pool.query(
      `INSERT INTO teams (name) VALUES ('Familie Burkard') RETURNING id`
    );
    teamId = t.rows[0].id;
    console.log("[create-admin] Team 'Familie Burkard' angelegt.");
  }

  const hash = await bcrypt.hash(password, 11);
  await pool.query(
    `INSERT INTO users (team_id, email, name, password_hash, role, active)
       VALUES ($1,$2,$3,$4,'admin',true)`,
    [teamId, email.toLowerCase(), name, hash]
  );
  console.log(`[create-admin] Admin ${email} angelegt.`);

  // Standard-Firmen anlegen, falls noch keine vorhanden.
  const companies = await pool.query(
    `SELECT count(*)::int AS n FROM companies WHERE team_id = $1`,
    [teamId]
  );
  if (companies.rows[0].n === 0) {
    const defaults = [
      ["aniFit.ch", "#f59e0b"],
      ["Life Plus", "#10b981"],
      ["Mental Coaching (meine Frau)", "#a855f7"],
    ];
    for (const [cname, color] of defaults) {
      await pool.query(
        `INSERT INTO companies (team_id, name, color) VALUES ($1,$2,$3)`,
        [teamId, cname, color]
      );
    }
    console.log("[create-admin] Standard-Firmen angelegt.");
  }

  await pool.end();
}

main().catch((e) => {
  console.error("[create-admin] Fehler:", e);
  process.exit(1);
});
