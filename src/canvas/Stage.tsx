import { uid } from "@/lib/ids";
import { useDocumentStore } from "@/store/documentStore";
import { useEditorStore } from "@/store/editorStore";
import {
  type Document,
  defaultArrowAnnotation,
  defaultBlurMaskAnnotation,
  defaultShapeAnnotation,
  defaultTextAnnotation,
} from "@/types/document";
import type Konva from "konva";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from "react";
import { Stage as KStage, Layer } from "react-konva";
import BackgroundNode from "./BackgroundNode";
import ScreenshotNode from "./ScreenshotNode";
import CreationOverlay from "./annotations/CreationOverlay";
import InteractiveAnnotations from "./annotations/InteractiveAnnotations";

export type CanvasStageHandle = {
  getStage: () => Konva.Stage | null;
  getDoc: () => Document;
};

type Props = {
  doc: Document;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  panX: number;
  panY: number;
};

const CanvasStage = forwardRef<CanvasStageHandle, Props>(function CanvasStage(
  { doc, viewportWidth, viewportHeight, zoom, panX, panY },
  ref,
) {
  const stageRef = useRef<Konva.Stage | null>(null);

  const addAnnotation = useDocumentStore((s) => s.addAnnotation);
  const tool = useEditorStore((s) => s.tool);
  const setTool = useEditorStore((s) => s.setTool);
  const draft = useEditorStore((s) => s.draftAnnotation);
  const setDraft = useEditorStore((s) => s.setDraftAnnotation);
  const setSelected = useEditorStore((s) => s.setSelectedAnnotation);

  useImperativeHandle(
    ref,
    () => ({
      getStage: () => stageRef.current,
      getDoc: () => doc,
    }),
    [doc],
  );

  const offset = useMemo(() => {
    return {
      x: (viewportWidth - doc.canvas.width * zoom) / 2 + panX,
      y: (viewportHeight - doc.canvas.height * zoom) / 2 + panY,
    };
  }, [viewportWidth, viewportHeight, doc.canvas.width, doc.canvas.height, zoom, panX, panY]);

  const docPointer = useCallback((): { x: number; y: number } | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return { x: (pos.x - offset.x) / zoom, y: (pos.y - offset.y) / zoom };
  }, [offset.x, offset.y, zoom]);

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      // Select tool: click on empty stage background (no annotation under pointer) deselects.
      if (tool === "select") {
        const target = e.target;
        if (target === stage || target.getAttr("id")?.startsWith?.("bg-")) {
          setSelected(null);
        }
        return;
      }

      const p = docPointer();
      if (!p) return;

      if (tool === "text") {
        const id = uid("anno");
        addAnnotation(defaultTextAnnotation(id, p.x, p.y));
        setSelected(id);
        setTool("select");
        return;
      }

      if (tool === "rect" || tool === "ellipse" || tool === "arrow" || tool === "blur") {
        setDraft({ type: tool, x: p.x, y: p.y, toX: p.x, toY: p.y });
      }
    },
    [tool, setSelected, setTool, setDraft, addAnnotation, docPointer],
  );

  const handleStageMouseMove = useCallback(() => {
    if (!draft) return;
    const p = docPointer();
    if (!p) return;
    setDraft({ ...draft, toX: p.x, toY: p.y });
  }, [draft, docPointer, setDraft]);

  const handleStageMouseUp = useCallback(() => {
    if (!draft) return;
    const id = uid("anno");
    const x = Math.min(draft.x, draft.toX);
    const y = Math.min(draft.y, draft.toY);
    const w = Math.abs(draft.toX - draft.x);
    const h = Math.abs(draft.toY - draft.y);

    // Ignore tiny accidental drags — just cancel.
    if (draft.type !== "arrow" && (w < 6 || h < 6)) {
      setDraft(null);
      setTool("select");
      return;
    }
    if (draft.type === "arrow") {
      const len = Math.hypot(draft.toX - draft.x, draft.toY - draft.y);
      if (len < 8) {
        setDraft(null);
        setTool("select");
        return;
      }
      addAnnotation(defaultArrowAnnotation(id, draft.x, draft.y, draft.toX, draft.toY));
    } else if (draft.type === "rect") {
      addAnnotation(defaultShapeAnnotation(id, x, y, w, h, "rect"));
    } else if (draft.type === "ellipse") {
      addAnnotation(defaultShapeAnnotation(id, x, y, w, h, "ellipse"));
    } else if (draft.type === "blur") {
      addAnnotation(defaultBlurMaskAnnotation(id, x, y, w, h));
    }
    setDraft(null);
    setSelected(id);
    setTool("select");
  }, [draft, addAnnotation, setDraft, setSelected, setTool]);

  const stageCursor = tool === "select" ? undefined : tool === "text" ? "text" : "crosshair";

  return (
    <KStage
      ref={stageRef}
      width={viewportWidth}
      height={viewportHeight}
      x={offset.x}
      y={offset.y}
      scaleX={zoom}
      scaleY={zoom}
      listening
      onMouseDown={handleStageMouseDown}
      onTouchStart={handleStageMouseDown}
      onMouseMove={handleStageMouseMove}
      onTouchMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
      onTouchEnd={handleStageMouseUp}
      style={stageCursor ? { cursor: stageCursor } : undefined}
    >
      <Layer listening={false} imageSmoothingEnabled>
        <BackgroundNode
          width={doc.canvas.width}
          height={doc.canvas.height}
          background={doc.background}
        />
      </Layer>

      <Layer listening={false} imageSmoothingEnabled>
        <ScreenshotNode doc={doc} />
      </Layer>

      <Layer listening={tool === "select"}>
        <InteractiveAnnotations doc={doc} />
      </Layer>

      <Layer listening={false}>
        <CreationOverlay />
      </Layer>
    </KStage>
  );
});

export default CanvasStage;
