import { z } from "zod";
import { failure, type Result } from "./result";
import { ShouldNeverHappen } from "./errorUtils";

export function findFirstNumber(str: string) {
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

export function findJsonArray<T>(
  str: string,
  itemSchema: z.ZodType<T>,
): Result<T[]> {
  if (str.split("[").length !== 2 || str.split("]").length !== 2) {
    return failure("No singular JSON array found.");
  }
  const arrayJsonInner = str.split("[")[1]?.split("]")[0];
  if (arrayJsonInner === undefined) {
    throw new ShouldNeverHappen();
  }
  const arrayJson = `[${arrayJsonInner}]`;
  try {
    const arr = z.array(itemSchema).parse(JSON.parse(arrayJson));
    return arr;
  } catch (e) {
    return failure("Could not parse JSON array.");
  }
}
