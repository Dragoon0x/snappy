import { migrateDocument } from "@/lib/db/migrations";
import { createEmptyDocument } from "@/store/documentStore";
import { CURRENT_SCHEMA_VERSION } from "@/types/document";
import { describe, expect, it } from "vitest";

describe("migrateDocument", () => {
  it("upgrades v1 docs by adding viewMode and three defaults", () => {
    const v1Raw = {
      schemaVersion: 1,
      id: "doc_test",
      name: "Old",
      canvas: { width: 1600, height: 1000 },
      background: { kind: "transparent" },
      screenshot: {
        assetId: null,
        frame: {
          id: "macos-window",
          variant: "dark",
          controls: { tabTitle: "Snappy", url: "snappy.app", showButtons: true },
        },
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        padding: 120,
        cornerRadius: 14,
        shadow: {
          enabled: true,
          color: "#000000",
          blur: 60,
          offsetX: 0,
          offsetY: 30,
          spread: 0,
          opacity: 0.35,
        },
        tiltX: 0,
        tiltY: 0,
      },
      annotations: [],
      assetRefs: [],
      createdAt: 1,
      updatedAt: 1,
    };
    const migrated = migrateDocument(v1Raw);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.viewMode).toBe("2d");
    expect(migrated.three).toBeDefined();
    expect(migrated.three.preset).toBe("hero");
    expect(migrated.three.environment).toBe("studio");
  });

  it("is identity at the current schema version", () => {
    const doc = createEmptyDocument();
    const raw = JSON.parse(JSON.stringify(doc));
    const migrated = migrateDocument(raw);
    expect(migrated.id).toBe(doc.id);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("throws for unknown versions below current", () => {
    const doc = createEmptyDocument();
    const raw = { ...JSON.parse(JSON.stringify(doc)), schemaVersion: 0 };
    expect(() => migrateDocument(raw)).toThrowError(/No migration path/);
  });
});
