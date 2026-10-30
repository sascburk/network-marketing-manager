import { requireUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";
import { ok, handleError } from "@/lib/api";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const user = await requireUser();
    const res = await sendPushToUser(user.id, {
      title: "Burkard CRM",
      body: "Test-Benachrichtigung erfolgreich! 🎉",
      url: "/",
      tag: "test",
    });
    if (res.sent === 0) {
      return NextResponse.json(
        {
          error:
            "Kein aktives Push-Abo gefunden. Bitte Benachrichtigungen zuerst aktivieren (auf dem iPhone: App zuerst zum Home-Bildschirm hinzufuegen).",
        },
        { status: 400 }
      );
    }
    return ok({ sent: res.sent });
  } catch (err) {
    return handleError(err);
  }
}
