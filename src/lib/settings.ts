import "server-only";
import { query, queryOne } from "./db";

export interface OllamaSettings {
  baseUrl: string;
  model: string;
}

const DEFAULTS: Record<string, string> = {
  ollama_base_url: "http://192.168.1.100:11434",
  ollama_model: "llama3.1",
};

export async function getSetting(
  teamId: string,
  key: string
): Promise<string | null> {
  const row = await queryOne<{ value: string | null }>(
    `SELECT value FROM settings WHERE team_id = $1 AND key = $2`,
    [teamId, key]
  );
  if (row && row.value !== null) return row.value;
  return DEFAULTS[key] ?? null;
}

export async function setSetting(
  teamId: string,
  key: string,
  value: string
): Promise<void> {
  await query(
    `INSERT INTO settings (team_id, key, value) VALUES ($1,$2,$3)
       ON CONFLICT (team_id, key) DO UPDATE SET value = EXCLUDED.value`,
    [teamId, key, value]
  );
}

export async function getOllamaSettings(
  teamId: string
): Promise<OllamaSettings> {
  const [baseUrl, model] = await Promise.all([
    getSetting(teamId, "ollama_base_url"),
    getSetting(teamId, "ollama_model"),
  ]);
  return {
    baseUrl: baseUrl ?? DEFAULTS.ollama_base_url,
    model: model ?? DEFAULTS.ollama_model,
  };
}
