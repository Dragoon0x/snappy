import { useEditorStore } from "@/store/editorStore";
import { beforeEach, describe, expect, it } from "vitest";

describe("editorStore", () => {
  beforeEach(() => {
    const init = useEditorStore.getState();
    useEditorStore.setState({
      tool: "select",
      activePanel: "background",
      isCommandPaletteOpen: false,
      isShortcutsOpen: false,
      isTemplatesOpen: false,
      isLeftPanelOpen: true,
      isRightPanelOpen: true,
      selectedAnnotationId: null,
      draftAnnotation: null,
      lastExportFormat: "png",
      zoom: 1,
      fitZoom: 1,
      panOffset: { x: 0, y: 0 },
      stageSize: { width: 800, height: 600 },
    });
    void init;
  });

  it("setTool updates the tool", () => {
    useEditorStore.getState().setTool("rect");
    expect(useEditorStore.getState().tool).toBe("rect");
  });

  it("toggleCommandPalette flips open", () => {
    useEditorStore.getState().toggleCommandPalette();
    expect(useEditorStore.getState().isCommandPaletteOpen).toBe(true);
    useEditorStore.getState().toggleCommandPalette();
    expect(useEditorStore.getState().isCommandPaletteOpen).toBe(false);
  });

  it("templates open/close independently of other modals", () => {
    useEditorStore.getState().openTemplates();
    expect(useEditorStore.getState().isTemplatesOpen).toBe(true);
    expect(useEditorStore.getState().isCommandPaletteOpen).toBe(false);
    useEditorStore.getState().closeTemplates();
    expect(useEditorStore.getState().isTemplatesOpen).toBe(false);
  });

  it("setSelectedAnnotation + setDraftAnnotation", () => {
    useEditorStore.getState().setSelectedAnnotation("anno_1");
    expect(useEditorStore.getState().selectedAnnotationId).toBe("anno_1");
    useEditorStore.getState().setDraftAnnotation({ type: "rect", x: 0, y: 0, toX: 10, toY: 10 });
    expect(useEditorStore.getState().draftAnnotation?.type).toBe("rect");
  });
});
