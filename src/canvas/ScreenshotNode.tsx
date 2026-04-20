import { frameDefs } from "@/lib/presets/frames";
import { useAssetStore } from "@/store/assetStore";
import type { Document } from "@/types/document";
import type Konva from "konva";
import { useMemo } from "react";
import { Group, Image as KImage, Rect } from "react-konva";
import FrameNodes from "./frames/FrameNodes";

type Props = {
  doc: Document;
};

export default function ScreenshotNode({ doc }: Props) {
  const { screenshot, canvas } = doc;
  const asset = useAssetStore((s) =>
    screenshot.assetId ? s.cache.get(screenshot.assetId) : undefined,
  );

  const frameDef = frameDefs[screenshot.frame.id];
  const padding = Math.max(0, screenshot.padding);
  const headerH = frameDef.headerHeight;
  const bezel = frameDef.bezelPad;

  /**
   * Compute the content size (image area) so that the entire composed
   * frame (content + header + bezel) fits within the canvas minus user padding.
   */
  const { contentW, contentH } = useMemo(() => {
    const maxW = Math.max(64, canvas.width - padding * 2 - bezel * 2);
    const maxH = Math.max(64, canvas.height - padding * 2 - headerH - bezel * 2);
    if (asset) {
      const iw = asset.width;
      const ih = asset.height;
      const s = Math.min(maxW / iw, maxH / ih);
      return { contentW: Math.max(1, iw * s), contentH: Math.max(1, ih * s) };
    }
    return { contentW: Math.min(800, maxW), contentH: Math.min(500, maxH) };
  }, [asset, canvas.width, canvas.height, padding, headerH, bezel]);

  // Full frame bounds in the group's local coords (content at origin).
  const outerX = -bezel;
  const outerY = -(bezel + headerH);
  const outerW = contentW + bezel * 2;
  const outerH = contentH + bezel * 2 + headerH;

  // Center the group on (canvas.center + screenshot offset) using offsetX/Y.
  const cx = canvas.width / 2 + screenshot.x;
  const cy = canvas.height / 2 + screenshot.y;
  const groupOffsetX = outerW / 2 - bezel; // shift so (outerX + outerW/2) lands at group x
  const groupOffsetY = outerH / 2 - bezel - headerH;

  const shadow = screenshot.shadow;
  const filters = shadow.enabled
    ? ({
        shadowColor: shadow.color,
        shadowBlur: shadow.blur,
        shadowOffsetX: shadow.offsetX,
        shadowOffsetY: shadow.offsetY,
        shadowOpacity: shadow.opacity,
      } satisfies Partial<Konva.ShapeConfig>)
    : {};

  const bodyColor =
    frameDef.bodyColor?.[screenshot.frame.variant] ??
    (frameDef.id === "none" || frameDef.id === "floating" ? "#00000000" : "#ffffff");

  const outerCorner = frameDef.id === "none" ? 0 : frameDef.cornerRadius;

  const innerCorner = frameDef.contentCornerRadius;

  return (
    <Group
      x={cx}
      y={cy}
      scaleX={screenshot.scale}
      scaleY={screenshot.scale}
      rotation={screenshot.rotation}
      offsetX={groupOffsetX}
      offsetY={groupOffsetY}
    >
      {/* Outer body (frame chassis + shadow). */}
      <Rect
        x={outerX}
        y={outerY}
        width={outerW}
        height={outerH}
        fill={frameDef.id === "none" ? "transparent" : bodyColor}
        cornerRadius={outerCorner}
        {...filters}
      />

      {/* Chrome (title bars, URL bar). */}
      <FrameNodes frame={screenshot.frame} contentWidth={contentW} contentHeight={contentH} />

      {/* Content clipped to inner radius. */}
      <Group
        clipFunc={(ctx) => {
          const r = innerCorner;
          const x = 0;
          const y = 0;
          const w = contentW;
          const h = contentH;
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.arcTo(x + w, y, x + w, y + h, r);
          ctx.arcTo(x + w, y + h, x, y + h, r);
          ctx.arcTo(x, y + h, x, y, r);
          ctx.arcTo(x, y, x + w, y, r);
          ctx.closePath();
        }}
      >
        {asset?.image ? (
          <KImage image={asset.image} x={0} y={0} width={contentW} height={contentH} />
        ) : (
          <PlaceholderContent width={contentW} height={contentH} />
        )}
      </Group>
    </Group>
  );
}

function PlaceholderContent({ width, height }: { width: number; height: number }) {
  return (
    <Group>
      <Rect x={0} y={0} width={width} height={height} fill="#f4f4f6" />
      <Rect
        x={width * 0.08}
        y={height * 0.12}
        width={width * 0.35}
        height={14}
        cornerRadius={4}
        fill="#d9d9df"
      />
      <Rect
        x={width * 0.08}
        y={height * 0.22}
        width={width * 0.25}
        height={10}
        cornerRadius={3}
        fill="#e4e4e8"
      />
      <Rect
        x={width * 0.08}
        y={height * 0.38}
        width={width * 0.62}
        height={height * 0.48}
        cornerRadius={12}
        fill="#e9e9ee"
      />
      <Rect
        x={width * 0.75}
        y={height * 0.38}
        width={width * 0.17}
        height={height * 0.2}
        cornerRadius={12}
        fill="#e9e9ee"
      />
      <Rect
        x={width * 0.75}
        y={height * 0.62}
        width={width * 0.17}
        height={height * 0.24}
        cornerRadius={12}
        fill="#e9e9ee"
      />
    </Group>
  );
}
