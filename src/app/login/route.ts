import { type NextRequest, NextResponse } from "next/server";
import { loginTokenQueryParam } from "~/common/constants";
import { getBaseUrl } from "~/common/urlUtils";

// see login/README.md for more details
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const loginToken = url.searchParams.get(loginTokenQueryParam);
  console.log("redirecting to login link", {
    loginToken,
    url,
  });
  return NextResponse.redirect(
    `${getBaseUrl()}/login/link?${loginTokenQueryParam}=${loginToken}`,
  );
}
