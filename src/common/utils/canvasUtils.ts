import { getBaseUrl } from "./urlUtils";

export const getRedirectUrl = (canvasSubdomain: string) =>
  `${getBaseUrl()}/login/canvas/${canvasSubdomain}`;

export const getCanvasBaseUrl = (canvasSubdomain: string) => {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return `https://${canvasSubdomain}.instructure.com`;
};
