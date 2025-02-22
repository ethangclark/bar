export function numericIdToImageNumber(numericId: number) {
  return numericId + 1000;
}
export function imageNumberToNumericId(imageNumber: number) {
  return imageNumber - 1000;
}

export function numericIdToVideoNumber(numericId: number) {
  return numericId + 2000;
}
export function videoNumberToNumericId(videoNumber: number) {
  return videoNumber - 2000;
}

export function isUuid(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
