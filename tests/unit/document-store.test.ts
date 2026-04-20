import {
  createEmptyDocument,
  documentTemporal,
  redo,
  undo,
  useDocumentStore,
} from "@/store/documentStore";
import {
  defaultBlurMaskAnnotation,
  defaultShapeAnnotation,
  defaultTextAnnotation,
} from "@/types/document";
import { beforeEach, describe, expect, it } from "vitest";

describe("documentStore", () => {
  beforeEach(() => {
    useDocumentStore.getState().setDoc(createEmptyDocument());
    documentTemporal.getState().clear();
  });

  it("addAnnotation appends and increments count", () => {
    const { addAnnotation } = useDocumentStore.getState();
    addAnnotation(defaultTextAnnotation("t1", 10, 10));
    addAnnotation(defaultShapeAnnotation("s1", 20, 20, 100, 50, "rect"));
    expect(useDocumentStore.getState().doc.annotations).toHaveLength(2);
  });

  it("updateAnnotation patches a specific annotation", () => {
    const { addAnnotation, updateAnnotation } = useDocumentStore.getState();
    addAnnotation(defaultShapeAnnotation("s1", 0, 0, 100, 50, "rect"));
    updateAnnotation("s1", { x: 42, y: 7 });
    const anno = useDocumentStore.getState().doc.annotations[0];
    expect(anno?.x).toBe(42);
    expect(anno?.y).toBe(7);
  });

  it("removeAnnotation drops by id", () => {
    const { addAnnotation, removeAnnotation } = useDocumentStore.getState();
    addAnnotation(defaultTextAnnotation("keep", 0, 0));
    addAnnotation(defaultTextAnnotation("drop", 0, 0));
    removeAnnotation("drop");
    const ids = useDocumentStore.getState().doc.annotations.map((a) => a.id);
    expect(ids).toEqual(["keep"]);
  });

  it("duplicateAnnotation clones + offsets position", () => {
    const { addAnnotation, duplicateAnnotation } = useDocumentStore.getState();
    addAnnotation(defaultBlurMaskAnnotation("orig", 100, 200, 50, 50));
    duplicateAnnotation("orig", "copy");
    const annos = useDocumentStore.getState().doc.annotations;
    expect(annos).toHaveLength(2);
    const copy = annos.find((a) => a.id === "copy");
    expect(copy?.x).toBe(124);
    expect(copy?.y).toBe(224);
  });

  it("undo reverts the last mutation and redo replays it", () => {
    const { addAnnotation, setName } = useDocumentStore.getState();
    setName("First");
    setName("Second");
    expect(useDocumentStore.getState().doc.name).toBe("Second");
    undo();
    expect(useDocumentStore.getState().doc.name).toBe("First");
    redo();
    expect(useDocumentStore.getState().doc.name).toBe("Second");

    addAnnotation(defaultTextAnnotation("t", 0, 0));
    expect(useDocumentStore.getState().doc.annotations).toHaveLength(1);
    undo();
    expect(useDocumentStore.getState().doc.annotations).toHaveLength(0);
  });

  it("undo/redo preserves referential integrity across many operations", () => {
    const { addAnnotation, updateAnnotation, removeAnnotation } = useDocumentStore.getState();
    const actions = () => {
      addAnnotation(defaultShapeAnnotation("a", 0, 0, 100, 100, "rect"));
      addAnnotation(defaultShapeAnnotation("b", 0, 0, 100, 100, "rect"));
      updateAnnotation("a", { x: 50 });
      removeAnnotation("b");
      updateAnnotation("a", { x: 75 });
    };
    actions();
    const afterAll = JSON.parse(JSON.stringify(useDocumentStore.getState().doc));
    for (let i = 0; i < 5; i++) undo();
    expect(useDocumentStore.getState().doc.annotations).toHaveLength(0);
    for (let i = 0; i < 5; i++) redo();
    const replayed = useDocumentStore.getState().doc;
    expect(replayed.annotations).toHaveLength(afterAll.annotations.length);
    expect(replayed.annotations[0]?.x).toBe(75);
  });
});
