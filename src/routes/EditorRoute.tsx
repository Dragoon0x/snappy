import CanvasStage, { type CanvasStageHandle } from "@/canvas/Stage";
import AnnotationToolbar from "@/components/AnnotationToolbar";
import { Suspense, lazy } from "react";

const ThreeStage = lazy(() => import("@/canvas/three/ThreeStage"));
import CommandPalette from "@/components/CommandPalette";
import DropZone from "@/components/DropZone";
import Onboarding from "@/components/Onboarding";
import ShortcutsModal from "@/components/ShortcutsModal";
import TemplatesModal from "@/components/TemplatesModal";
import Topbar from "@/components/Topbar";
import RightPanel from "@/components/panels/RightPanel";
import { useAutosave } from "@/hooks/useAutosave";
import { useClipboardPaste } from "@/hooks/useClipboardPaste";
import { useHotkey } from "@/hooks/useHotkey";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { hydrateDocumentAssets, ingestImageFile } from "@/lib/assets";
import { copyExport, downloadExport } from "@/lib/export";
import { uid } from "@/lib/ids";
import { suggestedFrameForAspect } from "@/lib/image/decode";
import { clamp } from "@/lib/utils";
import { useAssetStore } from "@/store/assetStore";
import { useDocumentStore } from "@/store/documentStore";
import { redo, undo } from "@/store/documentStore";
import { useEditorStore } from "@/store/editorStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { FrameId } from "@/types/document";
import type Konva from "konva";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function EditorRoute() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageHandleRef = useRef<CanvasStageHandle | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  const doc = useDocumentStore((s) => s.doc);
  const attachAsset = useDocumentStore((s) => s.attachAsset);
  const setScreenshot = useDocumentStore((s) => s.setScreenshot);
  const setFrame = useDocumentStore((s) => s.setFrame);

  const zoom = useEditorStore((s) => s.zoom);
  const fitZoom = useEditorStore((s) => s.fitZoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setFitZoom = useEditorStore((s) => s.setFitZoom);
  const panOffset = useEditorStore((s) => s.panOffset);
  const setPanOffset = useEditorStore((s) => s.setPanOffset);
  const toggleCmd = useEditorStore((s) => s.toggleCommandPalette);
  const toggleShortcuts = useEditorStore((s) => s.toggleShortcuts);
  const toggleTemplates = useEditorStore((s) => s.toggleTemplates);
  const isTemplatesOpen = useEditorStore((s) => s.isTemplatesOpen);
  const closeTemplates = useEditorStore((s) => s.closeTemplates);
  const isOnboardingOpen = useEditorStore((s) => s.isOnboardingOpen);
  const openOnboarding = useEditorStore((s) => s.openOnboarding);
  const closeOnboarding = useEditorStore((s) => s.closeOnboarding);
  const onboardingDone = useSettingsStore((s) => s.onboardingDone);
  const toggleRightPanel = useEditorStore((s) => s.toggleRightPanel);
  const setTool = useEditorStore((s) => s.setTool);
  const selectedAnnotationId = useEditorStore((s) => s.selectedAnnotationId);
  const setSelectedAnnotation = useEditorStore((s) => s.setSelectedAnnotation);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const removeAnnotation = useDocumentStore((s) => s.removeAnnotation);
  const duplicateAnnotation = useDocumentStore((s) => s.duplicateAnnotation);
  const setViewMode = useDocumentStore((s) => s.setViewMode);
  const isRightPanelOpen = useEditorStore((s) => s.isRightPanelOpen);
  const setLastFormat = useEditorStore((s) => s.setLastExportFormat);
  const lastFormat = useEditorStore((s) => s.lastExportFormat);

  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const viewport = useResizeObserver(viewportRef);
  const hasScreenshot = !!doc.screenshot.assetId;

  useAutosave();

  useEffect(() => {
    hydrateDocumentAssets(doc.id).catch(() => {
      // ignore; page may simply have no assets yet
    });
  }, [doc.id]);

  useEffect(() => {
    if (selectedAnnotationId) setActivePanel("inspector");
  }, [selectedAnnotationId, setActivePanel]);

  // Show onboarding on first visit only; user can reopen via command palette.
  useEffect(() => {
    if (!onboardingDone) openOnboarding();
  }, [onboardingDone, openOnboarding]);

  useEffect(() => {
    if (viewport.width === 0 || viewport.height === 0) return;
    const pad = 48;
    const available = {
      w: Math.max(100, viewport.width - pad * 2),
      h: Math.max(100, viewport.height - pad * 2),
    };
    const fit = Math.min(available.w / doc.canvas.width, available.h / doc.canvas.height, 1);
    setFitZoom(fit);
    setZoom(fit);
  }, [viewport.width, viewport.height, doc.canvas.width, doc.canvas.height, setFitZoom, setZoom]);

  const handleIngest = useCallback(
    async (file: File | Blob) => {
      try {
        const { id, width, height } = await ingestImageFile(file, doc.id);
        attachAsset(id);
        const suggested = suggestedFrameForAspect(width, height) as FrameId;
        setFrame({ id: suggested });
        setScreenshot({ scale: 1, rotation: 0, x: 0, y: 0 });
      } catch (err) {
        console.warn("Image ingest failed:", err);
      }
    },
    [doc.id, attachAsset, setFrame, setScreenshot],
  );

  useClipboardPaste((blob) => {
    handleIngest(blob);
  });

  useHotkey([
    { keys: "mod+k", handler: toggleCmd },
    { keys: "mod+t", handler: toggleTemplates },
    {
      keys: "3",
      handler: () => setViewMode(doc.viewMode === "3d" ? "2d" : "3d"),
    },
    { keys: "v", handler: () => setTool("select") },
    { keys: "t", handler: () => setTool("text") },
    { keys: "r", handler: () => setTool("rect") },
    { keys: "o", handler: () => setTool("ellipse") },
    { keys: "a", handler: () => setTool("arrow") },
    { keys: "b", handler: () => setTool("blur") },
    {
      keys: "escape",
      handler: () => {
        setSelectedAnnotation(null);
        setTool("select");
      },
    },
    {
      keys: "backspace",
      handler: () => {
        if (selectedAnnotationId) {
          removeAnnotation(selectedAnnotationId);
          setSelectedAnnotation(null);
        }
      },
    },
    {
      keys: "delete",
      handler: () => {
        if (selectedAnnotationId) {
          removeAnnotation(selectedAnnotationId);
          setSelectedAnnotation(null);
        }
      },
    },
    {
      keys: "mod+d",
      handler: () => {
        if (selectedAnnotationId) {
          const newId = uid("anno");
          duplicateAnnotation(selectedAnnotationId, newId);
          setSelectedAnnotation(newId);
        }
      },
    },
    { keys: "mod+z", handler: () => undo() },
    { keys: "mod+shift+z", handler: () => redo() },
    { keys: "mod+y", handler: () => redo() },
    { keys: "?", handler: toggleShortcuts },
    { keys: "mod+\\", handler: toggleRightPanel },
    {
      keys: "mod+e",
      handler: async () => {
        await downloadExport({
          doc,
          stage: stageRef.current,
          format: lastFormat,
          pixelRatio: 2,
          quality: 0.95,
          filename: doc.name.toLowerCase().replace(/\s+/g, "-") || "snappy",
        });
      },
    },
    {
      keys: "mod+shift+c",
      handler: async () => {
        try {
          await copyExport({
            doc,
            stage: stageRef.current,
            format: "png",
            pixelRatio: 2,
            quality: 1,
            filename: doc.name,
          });
        } catch (err) {
          console.warn(err);
        }
      },
    },
    {
      keys: "f",
      handler: () => setZoom(fitZoom),
    },
    {
      keys: "1",
      handler: () => setZoom(1),
    },
    {
      keys: "mod+=",
      handler: () => setZoom(clamp(zoom * 1.15, 0.1, 8)),
    },
    {
      keys: "mod+-",
      handler: () => setZoom(clamp(zoom / 1.15, 0.1, 8)),
    },
    {
      keys: "mod+shift+d",
      handler: () => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark"),
    },
  ]);

  useEffect(() => {
    stageRef.current = stageHandleRef.current?.getStage() ?? null;
  });

  const [panStart, setPanStart] = useState<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) {
        setIsSpacePressed(true);
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsSpacePressed(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isSpacePressed && e.button !== 1) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setPanStart({ x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y });
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!panStart) return;
    setPanOffset({
      x: panStart.ox + (e.clientX - panStart.x),
      y: panStart.oy + (e.clientY - panStart.y),
    });
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setPanStart(null);
  };

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      setZoom(clamp(zoom * (1 + delta), 0.1, 8));
    },
    [zoom, setZoom],
  );

  const zoomPct = useMemo(() => Math.round(zoom * 100), [zoom]);

  return (
    <div className="h-full flex flex-col">
      <Topbar stageRef={stageRef} />

      <div className="flex-1 flex overflow-hidden">
        <main className="relative flex-1 checker-bg overflow-hidden">
          <div
            ref={viewportRef}
            className="absolute inset-0"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            style={{ cursor: isSpacePressed ? (panStart ? "grabbing" : "grab") : undefined }}
          >
            {viewport.width > 0 && viewport.height > 0 ? (
              doc.viewMode === "3d" ? (
                <Suspense fallback={<ThreeLoadingFallback />}>
                  <ThreeStage doc={doc} width={viewport.width} height={viewport.height} />
                </Suspense>
              ) : (
                <CanvasStage
                  ref={(h) => {
                    stageHandleRef.current = h;
                    stageRef.current = h?.getStage() ?? null;
                  }}
                  doc={doc}
                  viewportWidth={viewport.width}
                  viewportHeight={viewport.height}
                  zoom={zoom}
                  panX={panOffset.x}
                  panY={panOffset.y}
                />
              )
            ) : null}

            <DropZone onFile={handleIngest} empty={!hasScreenshot} />
          </div>

          <AnnotationToolbar />

          <div className="absolute left-3 bottom-3 flex items-center gap-1 surface rounded-md px-2 py-1 text-xs">
            <button className="btn-icon" onClick={() => setZoom(clamp(zoom / 1.15, 0.1, 8))}>
              −
            </button>
            <span className="tabular-nums text-muted px-1">{zoomPct}%</span>
            <button className="btn-icon" onClick={() => setZoom(clamp(zoom * 1.15, 0.1, 8))}>
              +
            </button>
            <span className="w-px h-4 bg-border mx-1" />
            <button
              className="btn-ghost px-2 py-0.5 text-xs"
              onClick={() => setZoom(fitZoom)}
              title="Fit (F)"
            >
              Fit
            </button>
            <button
              className="btn-ghost px-2 py-0.5 text-xs"
              onClick={() => setZoom(1)}
              title="100% (1)"
            >
              1:1
            </button>
          </div>

          <button
            className="absolute right-3 top-3 btn-icon surface rounded-md"
            onClick={toggleRightPanel}
            title="Toggle right panel"
          >
            {isRightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        </main>

        <RightPanel stageRef={stageRef} />
      </div>

      <CommandPalette stageRef={stageRef} />
      <ShortcutsModal />
      <TemplatesModal open={isTemplatesOpen} onClose={closeTemplates} />
      <Onboarding open={isOnboardingOpen} onClose={closeOnboarding} />
    </div>
  );
}

function ThreeLoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
      Loading 3D scene…
    </div>
  );
}
