import crypto from "crypto";

export const sessionCookieName = "summitedsession";

export function getIpAddress(
  headerValueGetter: (headerName: string) => string | null,
) {
  const ipAddressHeader = headerValueGetter("x-forwarded-for") ?? "";
  const ipAddress = ipAddressHeader.split(",")[0];
  if (!ipAddress) throw new Error("IP address not found");
  return ipAddress;
}

export function safeHash({ value, salt }: { value: string; salt: string }) {
  const hashAsHex = crypto
    .pbkdf2Sync(value, salt, 1000, 64, "sha512")
    .toString("hex");
  return hashAsHex;
}

export function hashLoginToken(loginToken: string) {
  return safeHash({ value: loginToken, salt: "" });
}
