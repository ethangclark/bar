export const imageDataUrlPrefix = "data:image/";
export type imageDataUrl =
  `${typeof imageDataUrlPrefix}${string};base64,${string}`;

export function isImageDataUrl(url: string): url is imageDataUrl {
  return url.startsWith(imageDataUrlPrefix);
}

export const pngAsUrlPrefix = `${imageDataUrlPrefix}png;base64,`;
export const jpegAsUrlPrefix = `${imageDataUrlPrefix}jpeg;base64,`;

export function isPngContainedAsUrl(url: string) {
  return url.startsWith(pngAsUrlPrefix);
}
export function isJpegContainedAsUrl(url: string) {
  return url.startsWith(jpegAsUrlPrefix);
}

export function pngAsUrlToBase64(pngAsUrl: string) {
  return pngAsUrl.slice(pngAsUrlPrefix.length);
}
export function pngAsUrlToBuffer(pngAsUrl: string) {
  return Buffer.from(pngAsUrlToBase64(pngAsUrl), "base64");
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
