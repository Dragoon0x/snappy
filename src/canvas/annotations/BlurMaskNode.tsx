import { useAssetStore } from "@/store/assetStore";
import type { BlurMaskAnnotation, Document } from "@/types/document";
import type Konva from "konva";
import { useEffect, useMemo, useRef } from "react";
import { Rect } from "react-konva";
import { getScreenshotGeom } from "./annotationGeom";
import { buildMosaicCanvas } from "./mosaic";

type Props = {
  annotation: BlurMaskAnnotation;
  doc: Document;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (x: number, y: number) => void;
  draggable: boolean;
  nodeId: string;
};

export default function BlurMaskNode({
  annotation,
  doc,
  onClick,
  onDragEnd,
  draggable,
  nodeId,
}: Props) {
  const assetId = doc.screenshot.assetId;
  const asset = useAssetStore((s) => (assetId ? s.cache.get(assetId) : undefined));
  const rectRef = useRef<Konva.Rect | null>(null);

  const mosaic = useMemo(() => {
    if (!asset?.image) return null;
    try {
      return buildMosaicCanvas(asset.image, Math.max(8, Math.round(annotation.pixelSize * 1.5)));
    } catch {
      return null;
    }
  }, [asset, annotation.pixelSize]);

  const geom = useMemo(
    () =>
      getScreenshotGeom(
        doc.canvas.width,
        doc.canvas.height,
        doc.screenshot,
        asset?.width ?? null,
        asset?.height ?? null,
      ),
    [doc.canvas.width, doc.canvas.height, doc.screenshot, asset?.width, asset?.height],
  );

  useEffect(() => {
    const node = rectRef.current;
    if (!node) return;
    node.setAttr("id", nodeId);
  }, [nodeId]);

  // Pattern scale maps asset natural px → canvas px. Offset aligns the mosaic's
  // natural (0,0) with the screenshot content's top-left in canvas coords.
  const patternScaleX = asset ? geom.contentWidth / asset.width : 1;
  const patternScaleY = asset ? geom.contentHeight / asset.height : 1;
  const offsetX = asset ? (annotation.x - geom.contentX) / patternScaleX : 0;
  const offsetY = asset ? (annotation.y - geom.contentY) / patternScaleY : 0;

  if (!mosaic) {
    // Fallback: solid semi-opaque gray — user still knows there's a redaction.
    return (
      <Rect
        ref={rectRef}
        id={nodeId}
        x={annotation.x}
        y={annotation.y}
        width={annotation.width}
        height={annotation.height}
        rotation={annotation.rotation}
        opacity={annotation.opacity}
        cornerRadius={annotation.cornerRadius}
        fill="#40404a"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
        draggable={draggable}
        onClick={onClick}
        onTap={onClick}
        onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      />
    );
  }

  return (
    <Rect
      ref={rectRef}
      id={nodeId}
      x={annotation.x}
      y={annotation.y}
      width={annotation.width}
      height={annotation.height}
      rotation={annotation.rotation}
      opacity={annotation.opacity}
      cornerRadius={annotation.cornerRadius}
      fillPatternImage={mosaic as unknown as HTMLImageElement}
      fillPatternOffsetX={offsetX}
      fillPatternOffsetY={offsetY}
      fillPatternScaleX={patternScaleX}
      fillPatternScaleY={patternScaleY}
      fillPatternRepeat="no-repeat"
      stroke="rgba(255,255,255,0.12)"
      strokeWidth={1}
      draggable={draggable}
      onClick={onClick}
      onTap={onClick}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
    />
  );
}
