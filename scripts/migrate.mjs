// Fuehrt das DB-Schema aus (idempotent). Wartet auf die Datenbank.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL ist nicht gesetzt.");
  process.exit(1);
}

async function waitForDb(pool, retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch {
      console.log(`[migrate] Warte auf Datenbank... (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("Datenbank nicht erreichbar.");
}

async function main() {
  const pool = new Pool({ connectionString });
  await waitForDb(pool);
  const sql = readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf8");
  await pool.query(sql);
  console.log("[migrate] Schema erfolgreich angewendet.");
  await pool.end();
}

main().catch((e) => {
  console.error("[migrate] Fehler:", e);
  process.exit(1);
});
