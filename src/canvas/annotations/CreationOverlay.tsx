import { useEditorStore } from "@/store/editorStore";
import { Arrow, Ellipse, Rect } from "react-konva";

/**
 * Renders the in-flight draft annotation while the user is drag-creating.
 * Purely visual — pointer events are handled at the Stage level.
 */
export default function CreationOverlay() {
  const draft = useEditorStore((s) => s.draftAnnotation);
  if (!draft) return null;

  const x = Math.min(draft.x, draft.toX);
  const y = Math.min(draft.y, draft.toY);
  const w = Math.abs(draft.toX - draft.x);
  const h = Math.abs(draft.toY - draft.y);

  if (draft.type === "rect") {
    return (
      <Rect
        x={x}
        y={y}
        width={w}
        height={h}
        stroke="rgb(120 168 255)"
        strokeWidth={2}
        dash={[6, 6]}
        listening={false}
      />
    );
  }
  if (draft.type === "ellipse") {
    return (
      <Ellipse
        x={x + w / 2}
        y={y + h / 2}
        radiusX={Math.max(1, w / 2)}
        radiusY={Math.max(1, h / 2)}
        stroke="rgb(120 168 255)"
        strokeWidth={2}
        dash={[6, 6]}
        listening={false}
      />
    );
  }
  if (draft.type === "arrow") {
    return (
      <Arrow
        points={[draft.x, draft.y, draft.toX, draft.toY]}
        stroke="rgb(120 168 255)"
        fill="rgb(120 168 255)"
        strokeWidth={3}
        pointerLength={12}
        pointerWidth={12}
        dash={[6, 6]}
        listening={false}
      />
    );
  }
  if (draft.type === "blur") {
    return (
      <Rect
        x={x}
        y={y}
        width={w}
        height={h}
        stroke="rgb(120 168 255)"
        strokeWidth={2}
        dash={[6, 6]}
        fill="rgba(120, 168, 255, 0.15)"
        listening={false}
      />
    );
  }
  return null;
}
