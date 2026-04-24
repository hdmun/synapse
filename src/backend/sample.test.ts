import { expect, test, describe } from "bun:test";

describe("Backend Basic Test", () => {
  test("math works", () => {
    expect(1 + 1).toBe(2);
  });

  test("string inclusion", () => {
    expect("Gemini Monitor").toContain("Gemini");
  });
});
