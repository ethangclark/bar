import {
  browsyBrowserHeight,
  browsyBrowserWidth,
  annotationRows,
  annotationCols,
} from "./constants";

describe("browser constants", () => {
  test("browsyBrowserHeight is expected", () => {
    expect(browsyBrowserHeight).toBe(950);
  });
  test("browsyBrowserWidth is expected", () => {
    expect(browsyBrowserWidth).toBe(1248);
  });
  test(`browsyBrowserHeight is evenly divisible by annotationRows`, () => {
    expect((browsyBrowserHeight / annotationRows) % 1).toBe(0);
  });
  test(`browsyBrowserWidth is evenly divisible by rowCols`, () => {
    expect((browsyBrowserWidth / annotationCols) % 1).toBe(0);
  });
});
