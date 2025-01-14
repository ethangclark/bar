export function round(num: number, decimalPlaces: number) {
  // return parseFloat(num.toFixed(decimalPlaces)); // this breaks the test! wow!
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(num * factor) / factor;
}

export function stringAsNumberOr<T>(str: string, or: T) {
  const num = parseFloat(str);
  return isNaN(num) ? or : num;
}
