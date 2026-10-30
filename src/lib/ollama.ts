import "server-only";
import { getOllamaSettings } from "./settings";

export class OllamaError extends Error {}

interface GenerateOptions {
  teamId: string;
  prompt: string;
  system?: string;
  timeoutMs?: number;
}

/**
 * Ruft den lokalen Ollama-Server serverseitig auf (Browser braucht keinen
 * LAN-Zugriff). Gibt den generierten Text zurueck.
 */
export async function ollamaGenerate({
  teamId,
  prompt,
  system,
  timeoutMs = 120_000,
}: GenerateOptions): Promise<string> {
  const { baseUrl, model } = await getOllamaSettings(teamId);
  const url = `${baseUrl.replace(/\/$/, "")}/api/generate`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, system, stream: false }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new OllamaError(
        `Ollama antwortete mit Status ${res.status}. ${txt.slice(0, 200)}`
      );
    }
    const data = (await res.json()) as { response?: string };
    return (data.response ?? "").trim();
  } catch (err) {
    if (err instanceof OllamaError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new OllamaError(
        "Zeitueberschreitung bei der Verbindung zum Ollama-Server."
      );
    }
    throw new OllamaError(
      "Ollama-Server nicht erreichbar. Bitte URL in den Einstellungen pruefen und ob der Server laeuft."
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Prueft die Verbindung und listet verfuegbare Modelle. */
export async function ollamaTest(
  teamId: string
): Promise<{ ok: boolean; models: string[]; message: string }> {
  const { baseUrl, model } = await getOllamaSettings(teamId);
  const url = `${baseUrl.replace(/\/$/, "")}/api/tags`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      return {
        ok: false,
        models: [],
        message: `Server erreichbar, aber Status ${res.status}.`,
      };
    }
    const data = (await res.json()) as { models?: { name: string }[] };
    const models = (data.models ?? []).map((m) => m.name);
    const hasModel = models.some((m) => m === model || m.startsWith(model));
    return {
      ok: true,
      models,
      message: hasModel
        ? `Verbindung erfolgreich. Modell "${model}" ist verfuegbar.`
        : `Verbindung erfolgreich, aber Modell "${model}" wurde nicht gefunden. Verfuegbar: ${
            models.join(", ") || "keine"
          }.`,
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      models: [],
      message: aborted
        ? "Zeitueberschreitung. Ollama-Server nicht erreichbar."
        : "Ollama-Server nicht erreichbar. Bitte URL pruefen und ob der Server laeuft.",
    };
  } finally {
    clearTimeout(timer);
  }
}
