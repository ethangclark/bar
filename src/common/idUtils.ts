// TODO: audit use of these and maybe rename

export function numericIdToImageNumber(numericId: number) {
  return numericId + 1000;
}

export function imageNumberToNumericId(imageNumber: number) {
  return imageNumber - 1000;
}
