import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getOllamaSettings, setSetting } from "@/lib/settings";
import { ok, handleError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const ollama = await getOllamaSettings(user.team_id!);
    return ok({ ollama });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const b = await req.json();
    if (typeof b.ollama_base_url === "string") {
      await setSetting(user.team_id!, "ollama_base_url", b.ollama_base_url.trim());
    }
    if (typeof b.ollama_model === "string") {
      await setSetting(user.team_id!, "ollama_model", b.ollama_model.trim());
    }
    const ollama = await getOllamaSettings(user.team_id!);
    return ok({ ollama });
  } catch (err) {
    return handleError(err);
  }
}
