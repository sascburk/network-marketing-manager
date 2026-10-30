import "server-only";
import { queryOne } from "./db";
import type { User } from "./types";

/**
 * Prueft, ob ein Nutzer einen Kontakt sehen/bearbeiten darf:
 * - Admins immer
 * - Owner des Kontakts
 * - Nutzer, mit denen der Kontakt geteilt ist
 * Alle innerhalb desselben Teams.
 */
export async function canAccessContact(
  user: User,
  contactId: string
): Promise<boolean> {
  const row = await queryOne<{ allowed: boolean }>(
    `SELECT (
        c.team_id = $2
        AND (
          $3 = 'admin'
          OR c.owner_id = $1
          OR EXISTS (SELECT 1 FROM contact_shares cs
                      WHERE cs.contact_id = c.id AND cs.user_id = $1)
        )
      ) AS allowed
      FROM contacts c WHERE c.id = $4`,
    [user.id, user.team_id, user.role, contactId]
  );
  return !!row?.allowed;
}
