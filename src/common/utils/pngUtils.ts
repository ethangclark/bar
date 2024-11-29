export const pngAsUrlPrefix = "data:image/png;base64,";

export function pngAsUrlToBase64(pngUrl: string) {
  return pngUrl.slice(pngAsUrlPrefix.length);
}
export function pngAsUrlToBuffer(pngUrl: string) {
  return Buffer.from(pngAsUrlToBase64(pngUrl), "base64");
}
export function pngBase64ToBuffer(pngBase64: string) {
  return Buffer.from(pngBase64, "base64");
}
export function pngBase64ToUrl(pngBase64: string) {
  return `${pngAsUrlPrefix}${pngBase64}`;
}
export function pngBufferToBase64(pngBuffer: Buffer) {
  return pngBuffer.toString("base64");
}
export function pngBufferToUrl(pngBuffer: Buffer) {
  return pngBase64ToUrl(pngBufferToBase64(pngBuffer));
}
