export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const hostname = process.env.HOST_NAME;
  const port =
    process.env.NODE_ENV === "production" ? "" : `:${process.env.PORT ?? 4000}`;
  return `${protocol}://${hostname}${port}`;
}

export function getTrpcUrl() {
  return `${getBaseUrl()}/api/trpc`;
}
