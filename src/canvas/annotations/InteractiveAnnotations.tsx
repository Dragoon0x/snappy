import { useDocumentStore } from "@/store/documentStore";
import { useEditorStore } from "@/store/editorStore";
import type { Annotation, Document } from "@/types/document";
import type Konva from "konva";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Arrow, Ellipse, Group, Rect, Text, Transformer } from "react-konva";
import BlurMaskNode from "./BlurMaskNode";

type Props = {
  doc: Document;
};

const NODE_ID = (id: string) => `anno-${id}`;

export default function InteractiveAnnotations({ doc }: Props) {
  const updateAnnotation = useDocumentStore((s) => s.updateAnnotation);
  const selectedId = useEditorStore((s) => s.selectedAnnotationId);
  const setSelected = useEditorStore((s) => s.setSelectedAnnotation);
  const tool = useEditorStore((s) => s.tool);
  const setTool = useEditorStore((s) => s.setTool);

  const transformerRef = useRef<Konva.Transformer | null>(null);
  const layerHostRef = useRef<Konva.Group | null>(null);

  const selectable = tool === "select";

  const selectAnnotation = useCallback(
    (id: string) => {
      setSelected(id);
      if (tool !== "select") setTool("select");
    },
    [setSelected, setTool, tool],
  );

  // Attach transformer to the currently-selected annotation's node.
  useEffect(() => {
    const tr = transformerRef.current;
    const layer = layerHostRef.current;
    if (!tr || !layer) return;
    if (!selectedId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const stage = layer.getStage();
    if (!stage) return;
    const node = stage.findOne(`#${NODE_ID(selectedId)}`);
    if (node) {
      tr.nodes([node as Konva.Node]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
    }
  }, [selectedId, doc.annotations]);

  const selectedAnno = useMemo(
    () => doc.annotations.find((a) => a.id === selectedId) ?? null,
    [doc.annotations, selectedId],
  );

  const transformerEnabledAnchors = useMemo<string[]>(() => {
    if (!selectedAnno) return [];
    switch (selectedAnno.type) {
      case "text":
        return [
          "middle-left",
          "middle-right",
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ];
      case "shape":
      case "blur":
        return [
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
          "middle-left",
          "middle-right",
          "top-center",
          "bottom-center",
        ];
      case "arrow":
        return [];
      default:
        return [];
    }
  }, [selectedAnno]);

  return (
    <Group ref={layerHostRef}>
      {doc.annotations.map((a) => (
        <AnnotationNode
          key={a.id}
          annotation={a}
          doc={doc}
          selected={selectedId === a.id}
          selectable={selectable}
          onSelect={() => selectAnnotation(a.id)}
          onChange={(patch) => updateAnnotation(a.id, patch)}
        />
      ))}
      <Transformer
        ref={transformerRef}
        rotateEnabled
        enabledAnchors={transformerEnabledAnchors}
        anchorSize={9}
        anchorStroke="rgb(120 168 255)"
        anchorFill="#ffffff"
        anchorCornerRadius={9}
        borderStroke="rgb(120 168 255)"
        borderDash={[4, 4]}
        rotateAnchorOffset={28}
        keepRatio={false}
        flipEnabled={false}
        boundBoxFunc={(oldBox, newBox) => {
          if (Math.abs(newBox.width) < 8 || Math.abs(newBox.height) < 8) return oldBox;
          return newBox;
        }}
      />
    </Group>
  );
}

function AnnotationNode({
  annotation,
  doc,
  selected,
  selectable,
  onSelect,
  onChange,
}: {
  annotation: Annotation;
  doc: Document;
  selected: boolean;
  selectable: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<Annotation>) => void;
}) {
  const nodeRef = useRef<Konva.Node | null>(null);
  const id = NODE_ID(annotation.id);
  const listening = selectable;
  const draggable = selectable && !annotation.locked;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const target = e.target;
    if (annotation.type === "arrow") {
      const dx = target.x() - annotation.x;
      const dy = target.y() - annotation.y;
      onChange({
        x: annotation.x + dx,
        y: annotation.y + dy,
        toX: annotation.toX + dx,
        toY: annotation.toY + dy,
      } as Partial<Annotation>);
      target.position({ x: annotation.x + dx, y: annotation.y + dy });
    } else {
      onChange({ x: target.x(), y: target.y() } as Partial<Annotation>);
    }
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    if (annotation.type === "shape" || annotation.type === "blur") {
      onChange({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: Math.max(8, annotation.width * scaleX),
        height: Math.max(8, annotation.height * scaleY),
      } as Partial<Annotation>);
    } else if (annotation.type === "text") {
      const nextFont = Math.max(10, Math.round(annotation.fontSize * ((scaleX + scaleY) / 2)));
      onChange({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        fontSize: nextFont,
      } as Partial<Annotation>);
    } else if (annotation.type === "arrow") {
      onChange({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      } as Partial<Annotation>);
    }
  };

  const commonProps = {
    id,
    listening,
    draggable,
    opacity: annotation.opacity,
    onClick: () => selectable && onSelect(),
    onTap: () => selectable && onSelect(),
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
  } as const;

  if (annotation.type === "text") {
    return (
      <Text
        {...commonProps}
        ref={nodeRef as React.Ref<Konva.Text>}
        x={annotation.x}
        y={annotation.y}
        rotation={annotation.rotation}
        text={annotation.text}
        fontSize={annotation.fontSize}
        fontStyle={String(annotation.fontWeight)}
        fill={annotation.color}
        align={annotation.align}
        fontFamily={annotation.fontFamily}
        padding={4}
      />
    );
  }

  if (annotation.type === "shape") {
    if (annotation.shape === "ellipse") {
      return (
        <Ellipse
          {...commonProps}
          ref={nodeRef as React.Ref<Konva.Ellipse>}
          x={annotation.x + annotation.width / 2}
          y={annotation.y + annotation.height / 2}
          offsetX={0}
          offsetY={0}
          radiusX={Math.max(1, annotation.width / 2)}
          radiusY={Math.max(1, annotation.height / 2)}
          rotation={annotation.rotation}
          fill={annotation.fill}
          stroke={annotation.stroke}
          strokeWidth={annotation.strokeWidth}
          onDragEnd={(e) =>
            onChange({
              x: e.target.x() - annotation.width / 2,
              y: e.target.y() - annotation.height / 2,
            } as Partial<Annotation>)
          }
        />
      );
    }
    return (
      <Rect
        {...commonProps}
        ref={nodeRef as React.Ref<Konva.Rect>}
        x={annotation.x}
        y={annotation.y}
        width={Math.max(1, annotation.width)}
        height={Math.max(1, annotation.height)}
        rotation={annotation.rotation}
        fill={annotation.fill}
        stroke={annotation.stroke}
        strokeWidth={annotation.strokeWidth}
        cornerRadius={annotation.cornerRadius}
      />
    );
  }

  if (annotation.type === "arrow") {
    return (
      <Arrow
        {...commonProps}
        ref={nodeRef as React.Ref<Konva.Arrow>}
        x={annotation.x}
        y={annotation.y}
        points={[0, 0, annotation.toX - annotation.x, annotation.toY - annotation.y]}
        stroke={annotation.color}
        fill={annotation.color}
        strokeWidth={annotation.strokeWidth}
        pointerLength={12 + annotation.strokeWidth}
        pointerWidth={12 + annotation.strokeWidth}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={Math.max(16, annotation.strokeWidth + 12)}
        rotation={annotation.rotation}
      />
    );
  }

  if (annotation.type === "blur") {
    return (
      <BlurMaskNode
        annotation={annotation}
        doc={doc}
        nodeId={id}
        draggable={draggable}
        onClick={() => selectable && onSelect()}
        onDragEnd={(x, y) => onChange({ x, y } as Partial<Annotation>)}
      />
    );
  }

  return null;
}
