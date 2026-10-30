import { requireUser } from "@/lib/auth";
import { ollamaTest } from "@/lib/ollama";
import { ok, handleError } from "@/lib/api";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await ollamaTest(user.team_id!);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
