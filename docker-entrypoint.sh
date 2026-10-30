#!/bin/sh
set -e

echo "[entrypoint] Warte auf Datenbank und wende Migration an…"
node scripts/migrate.mjs

# Ersten Admin anlegen, wenn ADMIN_EMAIL + ADMIN_PASSWORD gesetzt sind.
# Idempotent: ueberspringt, wenn der Benutzer bereits existiert.
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "[entrypoint] Pruefe/erstelle ersten Admin ($ADMIN_EMAIL)…"
  node scripts/create-admin.mjs || echo "[entrypoint] Admin-Erstellung uebersprungen."
fi

echo "[entrypoint] Starte App…"
exec "$@"
