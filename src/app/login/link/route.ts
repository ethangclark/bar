// app/login/link/route.ts
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { loginTokenQueryParam } from "~/common/constants";
import { invoke } from "~/common/fnUtils";
import { db, schema } from "~/server/db";
import { loginUser } from "~/server/services/authService";
import { sessionCookieName } from "~/server/utils";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const loginToken = url.searchParams.get(loginTokenQueryParam);
  const sessionCookieValue =
    request.cookies.get(sessionCookieName)?.value ?? crypto.randomUUID();
  const session = await db.query.sessions.findFirst({
    where: eq(schema.sessions.sessionCookieValue, sessionCookieValue),
  });

  // If sessionId or login token is missing, redirect to the home page
  // (No session means they haven't visited the app before on their own, e.g. they're an email scanner.)
  if (!loginToken || !session) {
    return NextResponse.redirect(new URL("/", url));
  }

  const loginSuccess = await invoke(async () => {
    try {
      await loginUser(loginToken, session, db);
      return true;
    } catch (error) {
      console.error("Error logging in via link route", error);
      return false;
    }
  });

  return NextResponse.redirect(new URL(loginSuccess ? "/overview" : "/", url));
}
