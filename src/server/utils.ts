export const sessionCookieName = "summitedsession";

function querySessionCookieValue(
  cookieValueGetter: (cookieName: string) => string | null,
) {
  return cookieValueGetter(sessionCookieName);
}

export function getSessionCookieValue(
  cookieValueGetter: (cookieName: string) => string | null,
) {
  const cookieValue = querySessionCookieValue(cookieValueGetter);
  if (!cookieValue) throw new Error("Session cookie not found");
  return cookieValue;
}

export function getIpAddress(
  headerValueGetter: (headerName: string) => string | null,
) {
  const ipAddressHeader = headerValueGetter("x-forwarded-for") ?? "";
  const ipAddress = ipAddressHeader.split(",")[0];
  if (!ipAddress) throw new Error("IP address not found");
  return ipAddress;
}
