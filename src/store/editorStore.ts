import { create } from "zustand";

export type ToolId = "select" | "hand" | "text" | "rect" | "ellipse" | "arrow" | "blur";

export type PanelId = "inspector" | "background" | "frame" | "export";

export type DraftAnnotation = {
  type: "rect" | "ellipse" | "arrow" | "blur";
  x: number;
  y: number;
  toX: number;
  toY: number;
};

type EditorState = {
  tool: ToolId;
  zoom: number;
  fitZoom: number;
  panOffset: { x: number; y: number };
  activePanel: PanelId;
  isCommandPaletteOpen: boolean;
  isShortcutsOpen: boolean;
  isTemplatesOpen: boolean;
  isOnboardingOpen: boolean;
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  stageSize: { width: number; height: number };
  selectedAnnotationId: string | null;
  draftAnnotation: DraftAnnotation | null;
  lastExportFormat: "png" | "jpg" | "webp";
  setTool: (tool: ToolId) => void;
  setZoom: (zoom: number) => void;
  setFitZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setActivePanel: (panel: PanelId) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  openShortcuts: () => void;
  closeShortcuts: () => void;
  toggleShortcuts: () => void;
  openTemplates: () => void;
  closeTemplates: () => void;
  toggleTemplates: () => void;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setStageSize: (size: { width: number; height: number }) => void;
  setSelectedAnnotation: (id: string | null) => void;
  setDraftAnnotation: (draft: DraftAnnotation | null) => void;
  setLastExportFormat: (format: "png" | "jpg" | "webp") => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  tool: "select",
  zoom: 1,
  fitZoom: 1,
  panOffset: { x: 0, y: 0 },
  activePanel: "background",
  isCommandPaletteOpen: false,
  isShortcutsOpen: false,
  isTemplatesOpen: false,
  isOnboardingOpen: false,
  isLeftPanelOpen: true,
  isRightPanelOpen: true,
  stageSize: { width: 800, height: 600 },
  selectedAnnotationId: null,
  draftAnnotation: null,
  lastExportFormat: "png",

  setTool: (tool) => set({ tool }),
  setZoom: (zoom) => set({ zoom }),
  setFitZoom: (fitZoom) => set({ fitZoom }),
  setPanOffset: (panOffset) => set({ panOffset }),
  setActivePanel: (activePanel) => set({ activePanel }),
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleCommandPalette: () =>
    set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  openShortcuts: () => set({ isShortcutsOpen: true }),
  closeShortcuts: () => set({ isShortcutsOpen: false }),
  toggleShortcuts: () => set((state) => ({ isShortcutsOpen: !state.isShortcutsOpen })),
  openTemplates: () => set({ isTemplatesOpen: true }),
  closeTemplates: () => set({ isTemplatesOpen: false }),
  toggleTemplates: () => set((state) => ({ isTemplatesOpen: !state.isTemplatesOpen })),
  openOnboarding: () => set({ isOnboardingOpen: true }),
  closeOnboarding: () => set({ isOnboardingOpen: false }),
  toggleLeftPanel: () => set((state) => ({ isLeftPanelOpen: !state.isLeftPanelOpen })),
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  setStageSize: (stageSize) => set({ stageSize }),
  setSelectedAnnotation: (selectedAnnotationId) => set({ selectedAnnotationId }),
  setDraftAnnotation: (draftAnnotation) => set({ draftAnnotation }),
  setLastExportFormat: (lastExportFormat) => set({ lastExportFormat }),
}));
