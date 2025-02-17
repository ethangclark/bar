import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sessionCookieName } from "~/server/utils";

export async function middleware(request: NextRequest) {
  const cookie = request.cookies.get(sessionCookieName);
  if (!cookie) {
    const response = NextResponse.next();
    const newSessionValue = crypto.randomUUID();
    response.cookies.set(sessionCookieName, newSessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
    });
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
