import { describe, expect, it } from "vitest";
import { PublicResume } from "../../src/index";
import fixture from "../fixtures/public-resume.json";

type Mutable = {
  basics: Record<string, unknown>;
  work: { roles: Record<string, unknown>[] }[];
};

const clone = () => structuredClone(fixture) as unknown as Mutable;

describe("PublicResume", () => {
  it("accepts the public fixture", () => {
    expect(PublicResume.safeParse(fixture).success).toBe(true);
  });

  it("rejects a phone field", () => {
    const data = clone();
    data.basics.phone = "555-0100";
    const result = PublicResume.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.code).toBe("unrecognized_keys");
  });

  it("rejects an address field", () => {
    const data = clone();
    data.basics.address = "1 Main St";
    expect(PublicResume.safeParse(data).success).toBe(false);
  });

  it("rejects any email other than garrett@garrettmanley.com", () => {
    const data = clone();
    data.basics.email = "someone@example.com";
    expect(PublicResume.safeParse(data).success).toBe(false);
  });

  it("rejects extra keys on nested work roles", () => {
    const data = clone();
    const role = data.work[0]?.roles[0];
    if (role) role.salary = "secret";
    expect(PublicResume.safeParse(data).success).toBe(false);
  });
});
