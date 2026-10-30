# Burkard CRM

Ein privates **Network-Marketing-CRM** als installierbare **PWA** (iPhone, Android, iPad, PC) für Familie Burkard.
Selbst gehostet mit **Docker Compose**, läuft hinter dem **Cosmos-Cloud Reverse-Proxy** auf `nwm.burkard3.ch`.

## Funktionen

- **Kundenpflege:** Kontakte mit Firma/Produktlinie, Status-Pipeline (Lead → Interessent → Kunde → Partner), Tags, Adresse, Geburtstag.
- **Timeline:** Notizen, Interaktions-Historie (Anruf, Nachricht, Treffen, …) und Follow-up-Erinnerungen pro Kontakt.
- **Team & Teilen:** Du und deine Frau als Team. Jeder Kontakt hat einen Besitzer und kann mit Team-Mitgliedern geteilt werden.
- **Dashboard:** Kennzahlen, Pipeline, Kontakte nach Firma, anstehende Follow-ups, Geburtstage, letzte Aktivität.
- **KI (Ollama):** Nachrichten-Vorschläge, Zusammenfassungen und nächste beste Aktion – über deinen lokalen Ollama-Server.
- **Push-Benachrichtigungen:** Für iPhone & Android (Web Push), inkl. Geburtstags- und Follow-up-Erinnerungen.
- **Design:** Responsiv, einfache Bedienung, **automatischer Dark-Mode** (folgt dem Betriebssystem) mit manueller Umschaltung.
- **Benutzerverwaltung:** Admin legt Benutzer an, keine offene Registrierung.

## Firmen (vorkonfiguriert)

Beim ersten Start werden angelegt: **aniFit.ch**, **Life Plus** und **Mental Coaching (meine Frau)** –
alle Namen sind jederzeit unter *Firmen* änderbar.

---

## Technik

- **Next.js** (App Router, TypeScript), **PostgreSQL**, **Docker Compose**
- Next.js im *standalone*-Modus → schlankes Produktions-Image
- Datenbank-Schema per `db/schema.sql` (idempotent, läuft automatisch beim Start)

---

## Deployment Schritt für Schritt

> Voraussetzung: Docker + Docker Compose auf deinem Server, Git, und der Cosmos-Cloud-Proxy.

### 1. Repository klonen

```bash
git clone https://github.com/sascburk/network-marketing-manager.git
cd network-marketing-manager
```

(Bei Updates später: `git pull`.)

### 2. Umgebungsdatei anlegen

```bash
cp .env.example .env
```

### 3. Geheimnisse erzeugen und eintragen

**Session-Secret:**

```bash
openssl rand -base64 48
```

→ als `SESSION_SECRET` in die `.env` eintragen.

**VAPID-Schlüssel für Push** (benötigt einmalig Node oder nutze den Container-Weg weiter unten):

```bash
npm install          # nur falls du Node lokal nutzt
npm run gen-vapid
```

→ gibt `VAPID_PUBLIC_KEY` und `VAPID_PRIVATE_KEY` aus, beide in die `.env` eintragen.
`VAPID_SUBJECT` z. B. auf `mailto:admin@burkard3.ch` setzen.

> **Kein lokales Node?** Du kannst die VAPID-Schlüssel auch im Container erzeugen:
> ```bash
> docker compose run --rm app node scripts/gen-vapid.mjs
> ```

**Datenbank & Admin:** In der `.env` `POSTGRES_PASSWORD`, `DATABASE_URL` (gleiches Passwort!),
sowie `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` setzen. `APP_URL` = `https://nwm.burkard3.ch`.

### 4. Starten

```bash
docker compose up -d --build
```

Beim ersten Start wird automatisch:
- auf die Datenbank gewartet und das **Schema angewendet** (Migration),
- der **erste Admin** angelegt (aus `ADMIN_EMAIL`/`ADMIN_PASSWORD`),
- die **Standard-Firmen** erstellt.

Logs ansehen:

```bash
docker compose logs -f app
```

### 5. (Optional) Admin manuell anlegen / Passwort neu setzen

```bash
docker compose exec app node scripts/create-admin.mjs "neue@mail.ch" "PasswortMin8" "Name"
```

### 6. (Optional) Demo-Daten

```bash
docker compose exec app node scripts/seed.mjs
```

---

## Cosmos-Cloud + nwm.burkard3.ch einrichten

1. In **Cosmos-Cloud** eine neue **URL / Proxy-Regel** anlegen.
2. **Host/Domain:** `nwm.burkard3.ch` (DNS muss auf deinen Server zeigen).
3. **Ziel (Target):** der Container **`app`**, **Port `3000`**
   - Läuft Cosmos im selben Docker-Netzwerk, erreicht es den Container direkt über den Servicenamen `app:3000`.
   - Andernfalls in `docker-compose.yml` den Block `ports: - "3000:3000"` einkommentieren und auf `http://<server-ip>:3000` zeigen.
4. **HTTPS/TLS** am Cosmos-Proxy aktivieren (Let’s Encrypt). Die App selbst nutzt nur HTTP intern –
   das ist korrekt, da TLS am Proxy terminiert wird (die App vertraut `X-Forwarded-Proto`).
5. Danach ist die App unter **https://nwm.burkard3.ch** erreichbar.

---

## Als App installieren (PWA)

- **iPhone/iPad (Safari):** Seite öffnen → **Teilen** → **„Zum Home-Bildschirm“**.
  Danach die App vom Home-Bildschirm starten. **Push funktioniert auf iOS nur in der installierten App** (iOS 16.4+).
- **Android (Chrome):** Menü → **„App installieren“** / **„Zum Startbildschirm hinzufügen“**.
- **PC (Chrome/Edge):** Installations-Symbol in der Adresszeile.

Benachrichtigungen aktivierst du anschließend in **Einstellungen → Benachrichtigungen** (oder über das Banner auf dem Dashboard).

---

## KI (Ollama) verbinden

1. In der App: **Einstellungen → KI (Ollama)**.
2. **Basis-URL** deines Ollama-Servers eintragen, z. B. `http://192.168.1.100:11434`.
3. **Standard-Modell** setzen, z. B. `llama3.1`.
4. **„KI-Verbindung testen“** klicken.

> Wichtig: Der **App-Server** (Container) muss den Ollama-Server im Netzwerk erreichen – nicht der Browser.
> Läuft Ollama auf demselben Host, ist ggf. die LAN-IP nötig (nicht `localhost`, da der Container ein eigenes Netzwerk hat).

---

## Benachrichtigungs-Scheduler

Fällige Follow-ups und Geburtstage werden automatisch als Push verschickt.

- **Eingebaut (Standard):** `ENABLE_SCHEDULER=true` – ein Intervall-Job im App-Container prüft alle
  `SCHEDULER_INTERVAL_MINUTES` Minuten.
- **Extern (optional):** `ENABLE_SCHEDULER=false` setzen und per System-Cron den geschützten Endpunkt aufrufen:
  ```bash
  */15 * * * * curl -s -X POST https://nwm.burkard3.ch/api/cron/run -H "x-cron-secret: DEIN_SESSION_SECRET"
  ```
  (oder `node scripts/reminder-worker.mjs` mit gesetzten `APP_URL` und `SESSION_SECRET`.)

---

## Lokale Entwicklung (optional)

```bash
npm install
cp .env.example .env     # DATABASE_URL auf lokale Postgres zeigen lassen
npm run migrate
npm run create-admin
npm run dev              # http://localhost:3000
```

---

## Sicherheit

- Die `.env` ist in `.gitignore` – **niemals committen**. Nur `.env.example` ist im Repo.
- Passwörter werden mit **bcrypt** gehasht, Sessions laufen über **httpOnly-Cookies**.
- Keine offene Registrierung – Benutzer legt der Admin an.

---

## Erste Schritte zum Git-Push

```bash
git init                # falls noch kein Repo
git add .
git commit -m "Burkard CRM"
git branch -M main
git remote add origin https://github.com/sascburk/network-marketing-manager.git
git push -u origin main
```
