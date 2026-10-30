-- ============================================================
--  Burkard CRM  -  Datenbank-Schema (PostgreSQL)
--  Idempotent: kann mehrfach ausgefuehrt werden (CREATE IF NOT EXISTS).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Teams ----------
CREATE TABLE IF NOT EXISTS teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL DEFAULT 'Mein Team',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Benutzer ----------
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id        UUID REFERENCES teams(id) ON DELETE SET NULL,
  email          TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Sessions ----------
CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ---------- Firmen ----------
CREATE TABLE IF NOT EXISTS companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID REFERENCES teams(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#3270f6',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_companies_team ON companies(team_id);

-- ---------- Kontakte / Kunden ----------
CREATE TABLE IF NOT EXISTS contacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID REFERENCES teams(id) ON DELETE CASCADE,
  owner_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  company_id    UUID REFERENCES companies(id) ON DELETE SET NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT,
  phone         TEXT,
  email         TEXT,
  whatsapp      TEXT,
  address       TEXT,
  birthday      DATE,
  status        TEXT NOT NULL DEFAULT 'Lead'
                CHECK (status IN ('Lead','Interessent','Kunde','Partner')),
  tags          TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contacts_team ON contacts(team_id);
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);

-- ---------- Freigaben / Zuweisungen ----------
-- Ein Kontakt gehoert einem Owner und kann mit weiteren Team-Mitgliedern
-- geteilt werden (gemeinsame Bearbeitung durch beide Ehepartner).
CREATE TABLE IF NOT EXISTS contact_shares (
  contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (contact_id, user_id)
);

-- ---------- Notizen (Timeline) ----------
CREATE TABLE IF NOT EXISTS notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notes_contact ON notes(contact_id);

-- ---------- Interaktions-Historie ----------
CREATE TABLE IF NOT EXISTS interactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  type        TEXT NOT NULL DEFAULT 'note'
              CHECK (type IN ('call','message','meeting','email','whatsapp','note')),
  summary     TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interactions_contact ON interactions(contact_id);

-- ---------- Follow-up-Erinnerungen ----------
CREATE TABLE IF NOT EXISTS reminders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID REFERENCES teams(id) ON DELETE CASCADE,
  contact_id  UUID REFERENCES contacts(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  due_at      TIMESTAMPTZ NOT NULL,
  done        BOOLEAN NOT NULL DEFAULT false,
  notified    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reminders_team ON reminders(team_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_at);

-- ---------- Push-Abonnements ----------
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);

-- ---------- Geburtstags-Benachrichtigungs-Log ----------
-- Verhindert doppelte Geburtstags-Pushes pro Jahr.
CREATE TABLE IF NOT EXISTS birthday_notifications (
  contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  year        INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (contact_id, year)
);

-- ---------- Einstellungen (Key/Value, z.B. Ollama) ----------
CREATE TABLE IF NOT EXISTS settings (
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  value       TEXT,
  PRIMARY KEY (team_id, key)
);
