import { decodeShareString, encodeDocumentForShare } from "@/lib/share/encode";
import { createEmptyDocument } from "@/store/documentStore";
import type { Document } from "@/types/document";
import { describe, expect, it } from "vitest";

describe("share URL codec", () => {
  it("round-trips a default document", () => {
    const doc = createEmptyDocument();
    const result = encodeDocumentForShare(doc, "https://snappy.app");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.url.startsWith("https://snappy.app/#/s/")).toBe(true);
    const decoded = decodeShareString(result.payload);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(doc.id);
    expect(decoded?.background.kind).toBe(doc.background.kind);
  });

  it("strips asset refs from the URL payload (images are not re-encoded)", () => {
    const doc = createEmptyDocument();
    doc.assetRefs = ["asset_a", "asset_b"];
    const result = encodeDocumentForShare(doc);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const decoded = decodeShareString(result.payload);
    expect(decoded?.assetRefs).toEqual([]);
  });

  it("preserves annotations through round-trip", () => {
    const doc = createEmptyDocument();
    const next: Document = {
      ...doc,
      annotations: [
        {
          id: "a1",
          type: "text",
          space: "canvas",
          x: 10,
          y: 20,
          rotation: 0,
          opacity: 1,
          locked: false,
          text: "hello",
          fontSize: 32,
          fontWeight: 600,
          color: "#fff",
          align: "left",
          fontFamily: "Inter",
        },
        {
          id: "a2",
          type: "blur",
          space: "canvas",
          x: 50,
          y: 60,
          rotation: 0,
          opacity: 1,
          locked: false,
          width: 200,
          height: 48,
          cornerRadius: 4,
          pixelSize: 16,
        },
      ],
    };
    const result = encodeDocumentForShare(next);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const decoded = decodeShareString(result.payload);
    expect(decoded?.annotations).toHaveLength(2);
    expect(decoded?.annotations[0]?.type).toBe("text");
    expect(decoded?.annotations[1]?.type).toBe("blur");
  });

  it("returns a failure result for oversize payloads", () => {
    const doc = createEmptyDocument();
    // Inflate the document until it exceeds the cap.
    doc.annotations = Array.from({ length: 400 }, (_, i) => ({
      id: `anno_${i}`,
      type: "text" as const,
      space: "canvas" as const,
      x: i,
      y: i,
      rotation: 0,
      opacity: 1,
      locked: false,
      text: "x".repeat(80),
      fontSize: 16,
      fontWeight: 400,
      color: "#ffffff",
      align: "left" as const,
      fontFamily: "Inter",
    }));
    const result = encodeDocumentForShare(doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("too-large");
    expect(result.size).toBeGreaterThan(0);
  });

  it("returns null for malformed input", () => {
    expect(decodeShareString("#####")).toBeNull();
    expect(decodeShareString("")).toBeNull();
  });
});
