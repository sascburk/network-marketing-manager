import { NextResponse } from "next/server";
import { AuthError } from "./auth";

/** Vereinheitlichtes Error-Handling fuer API-Routen (deutsche Meldungen). */
export function handleError(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message =
    err instanceof Error ? err.message : "Unbekannter Fehler.";
  console.error("[api]", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export function ok(data: unknown = { ok: true }): NextResponse {
  return NextResponse.json(data);
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}
