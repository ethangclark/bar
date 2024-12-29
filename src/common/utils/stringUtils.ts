import { z } from "zod";
import { ShouldNeverHappenError } from "./errorUtils";

export function findFirstNumber(str: string) {
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

export function findJsonArray<T>(
  str: string,
  itemSchema: z.ZodType<T>,
): T[] | Error {
  if (str.split("[").length !== 2 || str.split("]").length !== 2) {
    return new Error("No singular JSON array found.");
  }
  const arrayJsonInner = str.split("[")[1]?.split("]")[0];
  if (arrayJsonInner === undefined) {
    throw new ShouldNeverHappenError();
  }
  const arrayJson = `[${arrayJsonInner}]`;
  try {
    const arr = z.array(itemSchema).parse(JSON.parse(arrayJson));
    return arr;
  } catch (e) {
    return new Error("Could not parse JSON array.");
  }
}
