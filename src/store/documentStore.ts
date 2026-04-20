import { uid } from "@/lib/ids";
import { gradientPresets } from "@/lib/presets/gradients";
import {
  type Annotation,
  type Background,
  CURRENT_SCHEMA_VERSION,
  type Document,
  type FrameSpec,
  type Screenshot,
  type Shadow,
  type ThreeConfig,
  type ViewMode,
  defaultScreenshot,
  defaultThreeConfig,
} from "@/types/document";
import { produce } from "immer";
import { temporal } from "zundo";
import { create } from "zustand";

export function createEmptyDocument(): Document {
  const now = Date.now();
  const firstPreset = gradientPresets[0];
  const background: Background = firstPreset
    ? firstPreset.background
    : { kind: "solid", color: "#111111" };
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: uid("doc"),
    name: "Untitled",
    canvas: { width: 1600, height: 1000, aspectPreset: "twitter-post" },
    background,
    screenshot: defaultScreenshot(),
    annotations: [],
    assetRefs: [],
    viewMode: "2d",
    three: defaultThreeConfig(),
    createdAt: now,
    updatedAt: now,
  };
}

type DocumentState = {
  doc: Document;
  isDirty: boolean;
  setDoc: (doc: Document) => void;
  reset: () => void;
  apply: (mutator: (draft: Document) => void) => void;
  setName: (name: string) => void;
  setCanvasSize: (width: number, height: number, preset?: string) => void;
  setBackground: (bg: Background) => void;
  setScreenshot: (patch: Partial<Screenshot>) => void;
  setScreenshotShadow: (patch: Partial<Shadow>) => void;
  setFrame: (frame: Partial<FrameSpec>) => void;
  attachAsset: (assetId: string) => void;
  detachAsset: () => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  duplicateAnnotation: (id: string, newId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setThreeConfig: (patch: Partial<ThreeConfig>) => void;
};

export const useDocumentStore = create<DocumentState>()(
  temporal(
    (set) => ({
      doc: createEmptyDocument(),
      isDirty: false,

      setDoc: (doc) => set({ doc, isDirty: false }),

      reset: () => set({ doc: createEmptyDocument(), isDirty: false }),

      apply: (mutator) =>
        set((state) => ({
          doc: produce(state.doc, (draft) => {
            mutator(draft);
            draft.updatedAt = Date.now();
          }),
          isDirty: true,
        })),

      setName: (name) =>
        set((state) => ({
          doc: { ...state.doc, name, updatedAt: Date.now() },
          isDirty: true,
        })),

      setCanvasSize: (width, height, preset) =>
        set((state) => ({
          doc: {
            ...state.doc,
            canvas: { width, height, aspectPreset: preset },
            updatedAt: Date.now(),
          },
          isDirty: true,
        })),

      setBackground: (bg) =>
        set((state) => ({
          doc: { ...state.doc, background: bg, updatedAt: Date.now() },
          isDirty: true,
        })),

      setScreenshot: (patch) =>
        set((state) => ({
          doc: {
            ...state.doc,
            screenshot: { ...state.doc.screenshot, ...patch },
            updatedAt: Date.now(),
          },
          isDirty: true,
        })),

      setScreenshotShadow: (patch) =>
        set((state) => ({
          doc: {
            ...state.doc,
            screenshot: {
              ...state.doc.screenshot,
              shadow: { ...state.doc.screenshot.shadow, ...patch },
            },
            updatedAt: Date.now(),
          },
          isDirty: true,
        })),

      setFrame: (patch) =>
        set((state) => ({
          doc: {
            ...state.doc,
            screenshot: {
              ...state.doc.screenshot,
              frame: {
                ...state.doc.screenshot.frame,
                ...patch,
                controls: {
                  ...state.doc.screenshot.frame.controls,
                  ...(patch.controls ?? {}),
                },
              },
            },
            updatedAt: Date.now(),
          },
          isDirty: true,
        })),

      attachAsset: (assetId) =>
        set((state) => {
          const refs = Array.from(new Set([...state.doc.assetRefs, assetId]));
          return {
            doc: {
              ...state.doc,
              screenshot: { ...state.doc.screenshot, assetId },
              assetRefs: refs,
              updatedAt: Date.now(),
            },
            isDirty: true,
          };
        }),

      detachAsset: () =>
        set((state) => ({
          doc: {
            ...state.doc,
            screenshot: { ...state.doc.screenshot, assetId: null },
            updatedAt: Date.now(),
          },
          isDirty: true,
        })),

      addAnnotation: (annotation) =>
        set((state) => ({
          doc: {
            ...state.doc,
            annotations: [...state.doc.annotations, annotation],
            updatedAt: Date.now(),
          },
          isDirty: true,
        })),

      updateAnnotation: (id, patch) =>
        set((state) => ({
          doc: {
            ...state.doc,
            annotations: state.doc.annotations.map((a) =>
              a.id === id ? ({ ...a, ...patch } as Annotation) : a,
            ),
            updatedAt: Date.now(),
          },
          isDirty: true,
        })),

      removeAnnotation: (id) =>
        set((state) => ({
          doc: {
            ...state.doc,
            annotations: state.doc.annotations.filter((a) => a.id !== id),
            updatedAt: Date.now(),
          },
          isDirty: true,
        })),

      duplicateAnnotation: (id, newId) =>
        set((state) => {
          const src = state.doc.annotations.find((a) => a.id === id);
          if (!src) return state;
          const clone = { ...src, id: newId, x: src.x + 24, y: src.y + 24 } as Annotation;
          return {
            doc: {
              ...state.doc,
              annotations: [...state.doc.annotations, clone],
              updatedAt: Date.now(),
            },
            isDirty: true,
          };
        }),

      setViewMode: (mode) =>
        set((state) => ({
          doc: { ...state.doc, viewMode: mode, updatedAt: Date.now() },
          isDirty: true,
        })),

      setThreeConfig: (patch) =>
        set((state) => ({
          doc: {
            ...state.doc,
            three: { ...state.doc.three, ...patch },
            updatedAt: Date.now(),
          },
          isDirty: true,
        })),
    }),
    {
      limit: 50,
      partialize: (state) => ({ doc: state.doc }) as DocumentState,
      equality: (a, b) => a.doc === b.doc,
    },
  ),
);

export const documentTemporal = useDocumentStore.temporal;

export function undo(): void {
  documentTemporal.getState().undo();
}

export function redo(): void {
  documentTemporal.getState().redo();
}

export function canUndo(): boolean {
  return documentTemporal.getState().pastStates.length > 0;
}

export function canRedo(): boolean {
  return documentTemporal.getState().futureStates.length > 0;
}
