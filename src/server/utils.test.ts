import { hashPassword } from "./utils";

describe(hashPassword.name, () => {
  it("should return non-empty result with an empty string", () => {
    const hashedPassword = hashPassword({ password: "", salt: "asdf" });
    expect(hashedPassword).toBeDefined();
    expect(hashedPassword.length).toBeGreaterThan(0);
  });
});
