import { uid } from "@/lib/ids";
import { describe, expect, it } from "vitest";

describe("uid", () => {
  it("produces a non-empty string", () => {
    expect(uid()).toMatch(/\S+/);
  });

  it("prepends a prefix when provided", () => {
    const id = uid("doc");
    expect(id.startsWith("doc_")).toBe(true);
    expect(id.length).toBeGreaterThan(4);
  });

  it("is collision-free across 2000 samples", () => {
    const set = new Set<string>();
    for (let i = 0; i < 2000; i++) set.add(uid());
    expect(set.size).toBe(2000);
  });
});
