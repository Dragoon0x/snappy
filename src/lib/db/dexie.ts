import type { Document } from "@/types/document";
import Dexie, { type Table } from "dexie";

export type AssetRecord = {
  id: string;
  documentId: string;
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  createdAt: number;
};

export type DocumentRecord = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  schemaVersion: number;
  doc: Document;
};

export type ThumbnailRecord = {
  documentId: string;
  blob: Blob;
  updatedAt: number;
};

class SnappyDB extends Dexie {
  documents!: Table<DocumentRecord, string>;
  assets!: Table<AssetRecord, string>;
  thumbnails!: Table<ThumbnailRecord, string>;

  constructor() {
    super("snappy");
    this.version(1).stores({
      documents: "id, updatedAt, createdAt",
      assets: "id, documentId",
      thumbnails: "documentId, updatedAt",
    });
  }
}

export const db = new SnappyDB();

export async function saveDocument(doc: Document): Promise<void> {
  await db.documents.put({
    id: doc.id,
    name: doc.name,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    schemaVersion: doc.schemaVersion,
    doc,
  });
}

export async function loadDocument(id: string): Promise<Document | undefined> {
  const rec = await db.documents.get(id);
  return rec?.doc;
}

export async function deleteDocument(id: string): Promise<void> {
  await db.transaction("rw", db.documents, db.assets, db.thumbnails, async () => {
    await db.documents.delete(id);
    await db.assets.where("documentId").equals(id).delete();
    await db.thumbnails.delete(id);
  });
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  return db.documents.orderBy("updatedAt").reverse().toArray();
}

export async function saveAsset(asset: AssetRecord): Promise<void> {
  await db.assets.put(asset);
}

export async function loadAsset(id: string): Promise<AssetRecord | undefined> {
  return db.assets.get(id);
}

export async function saveThumbnail(documentId: string, blob: Blob): Promise<void> {
  await db.thumbnails.put({ documentId, blob, updatedAt: Date.now() });
}
