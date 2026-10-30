import { getVapidPublicKey } from "@/lib/push";
import { ok, handleError } from "@/lib/api";

export async function GET() {
  try {
    return ok({ publicKey: getVapidPublicKey() });
  } catch (err) {
    return handleError(err);
  }
}
