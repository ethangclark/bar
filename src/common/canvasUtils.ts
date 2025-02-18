import { getBaseUrl } from "./urlUtils";

export const getRedirectUrl = (canvasSubdomain: string) =>
  `${getBaseUrl()}/login/canvas/${canvasSubdomain}`;

export const getCanvasBaseUrl = (canvasSubdomain: string) => {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return `https://${canvasSubdomain}.instructure.com`;
};

export function getCanvasSubdomain(url: string): string | null {
  try {
    // Normalize and parse the URL
    const parsedUrl = new URL(url.trim());
    const hostname = parsedUrl.hostname;

    // Match the subdomain if it's in the form of `subdomain.instructure.com`
    const match = hostname.match(/^([^.]+)\.instructure\.com$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
