import { NextRequest } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";
import { canAccessContact } from "@/lib/access";
import { ollamaGenerate, OllamaError } from "@/lib/ollama";
import { ok, badRequest } from "@/lib/api";
import { NextResponse } from "next/server";

// action: "message" | "summary" | "next-action"
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!(await canAccessContact(user, id))) {
      throw new AuthError("Kein Zugriff auf diesen Kontakt.", 403);
    }
    const { action, channel } = await req.json();

    const contact = await queryOne<{
      first_name: string;
      last_name: string | null;
      status: string;
      tags: string[];
      company_name: string | null;
    }>(
      `SELECT c.first_name, c.last_name, c.status, c.tags, co.name AS company_name
         FROM contacts c LEFT JOIN companies co ON co.id = c.company_id
        WHERE c.id = $1`,
      [id]
    );
    if (!contact) return badRequest("Kontakt nicht gefunden.");

    const notes = await query<{ body: string; created_at: string }>(
      `SELECT body, created_at FROM notes WHERE contact_id=$1 ORDER BY created_at DESC LIMIT 15`,
      [id]
    );
    const interactions = await query<{
      type: string;
      summary: string;
      occurred_at: string;
    }>(
      `SELECT type, summary, occurred_at FROM interactions WHERE contact_id=$1 ORDER BY occurred_at DESC LIMIT 15`,
      [id]
    );

    const name = `${contact.first_name} ${contact.last_name ?? ""}`.trim();
    const contextLines = [
      `Name: ${name}`,
      `Firma/Produktlinie: ${contact.company_name ?? "unbekannt"}`,
      `Status in der Pipeline: ${contact.status}`,
      contact.tags?.length ? `Tags: ${contact.tags.join(", ")}` : "",
      "",
      "Notizen (neueste zuerst):",
      ...(notes.length
        ? notes.map((n) => `- ${n.body}`)
        : ["- (keine Notizen)"]),
      "",
      "Interaktionen (neueste zuerst):",
      ...(interactions.length
        ? interactions.map((i) => `- [${i.type}] ${i.summary}`)
        : ["- (keine Interaktionen)"]),
    ]
      .filter(Boolean)
      .join("\n");

    const system =
      "Du bist ein hilfreicher Assistent fuer einen Network-Marketing-Vertriebspartner in der Schweiz. " +
      "Antworte immer auf Deutsch (Schweizer Hochdeutsch, kein 'ß'), freundlich, persoenlich, authentisch und niemals aufdringlich oder spammy.";

    let prompt = "";
    if (action === "message") {
      const ch = channel || "WhatsApp";
      prompt =
        `Schreibe eine kurze, persoenliche Follow-up-Nachricht (Kanal: ${ch}) an den folgenden Kontakt. ` +
        `Beziehe dich passend auf Firma/Produkt und den aktuellen Status. Kein Betreff, nur der Nachrichtentext. ` +
        `Maximal 6 Saetze.\n\nKontext:\n${contextLines}`;
    } else if (action === "summary") {
      prompt =
        `Fasse die Beziehung zu diesem Kontakt kurz zusammen (Stichpunkte): aktueller Stand, wichtigste Infos, ` +
        `Interessen/Bedarf. Maximal 8 Stichpunkte.\n\nKontext:\n${contextLines}`;
    } else if (action === "next-action") {
      prompt =
        `Empfiehl die naechste sinnvolle Aktion fuer diesen Kontakt (konkret und umsetzbar). ` +
        `Nenne 2-3 Optionen mit kurzer Begruendung.\n\nKontext:\n${contextLines}`;
    } else {
      return badRequest("Unbekannte Aktion.");
    }

    const text = await ollamaGenerate({ teamId: user.team_id!, prompt, system });
    return ok({ text });
  } catch (err) {
    if (err instanceof OllamaError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[ollama/contact]", err);
    return NextResponse.json(
      { error: "Fehler bei der KI-Anfrage." },
      { status: 500 }
    );
  }
}
