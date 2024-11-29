import { language } from "./languageUtils";

export const moneySymbol = "$"; // just so it's trackable where we use this
const currency = "USD"; // just so it's trackable where we use this

// unsafe because it can return e.g. -0.000
function unsafeGetTruncatedStrRep(amount: number): string {
  return amount.toFixed(3); // GPT-4o says no countries have a convention of more than 3 decimal places
}

const zeroBaseStr = unsafeGetTruncatedStrRep(0);

// unsafe because it can return e.g. -$0.00
const unsafeCurrencyFormat = Intl.NumberFormat(language, {
  style: "currency",
  currency,
});

export function formatMoney(amount: number): string {
  const strRep = unsafeGetTruncatedStrRep(amount);
  const strRepAsNumber = parseFloat(strRep);
  if (strRepAsNumber === 0) {
    if (strRep !== zeroBaseStr) {
      return formatMoney(0); // covers -0.00
    }
  }
  return unsafeCurrencyFormat.format(strRepAsNumber);
}
