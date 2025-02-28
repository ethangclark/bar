// app/login/link/route.ts
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { assertOne } from "~/common/assertions";
import { loginTokenQueryParam } from "~/common/constants";
import { invoke } from "~/common/fnUtils";
import { getBaseUrl } from "~/common/urlUtils";
import { db, schema } from "~/server/db";
import { loginUser } from "~/server/services/authService";
import { getIpAddress, sessionCookieName } from "~/server/utils";

// see login/README.md for more details

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const loginToken = url.searchParams.get(loginTokenQueryParam);
  const sessionCookieValue =
    request.cookies.get(sessionCookieName)?.value ?? null;

  // If sessionId or login token is missing, redirect to the home page
  // (No session means they haven't visited the app before on their own, e.g. they're an email scanner.)
  if (!loginToken || !sessionCookieValue) {
    console.log("redirecting to home page", {
      loginToken,
      sessionCookieValue,
      url,
    });
    return NextResponse.redirect(getBaseUrl());
  }

  let session = await db.query.sessions.findFirst({
    where: eq(schema.sessions.sessionCookieValue, sessionCookieValue),
  });
  if (!session) {
    const sessions = await db
      .insert(schema.sessions)
      .values({
        sessionCookieValue,
        lastIpAddress: getIpAddress((headerName) =>
          request.headers.get(headerName),
        ),
      })
      .returning();
    session = assertOne(sessions);
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

  console.log("loginSuccess", loginSuccess, {
    loginToken,
    session,
    url,
  });

  return NextResponse.redirect(
    `${getBaseUrl()}${loginSuccess ? "/overview" : ""}`,
  );
}
