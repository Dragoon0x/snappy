import { CURRENT_SCHEMA_VERSION, type Document, defaultThreeConfig } from "@/types/document";

type Migration = (doc: Record<string, unknown>) => Record<string, unknown>;

/**
 * v1 → v2: add viewMode + three config so existing documents can be opened.
 */
const migrations: Record<number, Migration> = {
  1: (doc) => ({
    ...doc,
    schemaVersion: 2,
    viewMode: doc.viewMode ?? "2d",
    three: doc.three ?? defaultThreeConfig(),
  }),
};

export function migrateDocument(raw: Record<string, unknown>): Document {
  let doc = raw;
  let version = typeof raw.schemaVersion === "number" ? raw.schemaVersion : 0;
  while (version < CURRENT_SCHEMA_VERSION) {
    const mig = migrations[version];
    if (!mig) {
      throw new Error(`No migration path from schemaVersion ${version}`);
    }
    doc = mig(doc);
    version += 1;
  }
  return doc as unknown as Document;
}
