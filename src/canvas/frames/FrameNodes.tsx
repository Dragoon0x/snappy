import { frameDefs } from "@/lib/presets/frames";
import type { FrameSpec } from "@/types/document";
import { Circle, Group, Rect, Text } from "react-konva";

type Props = {
  frame: FrameSpec;
  contentWidth: number;
  contentHeight: number;
};

const light = {
  chrome: "#f4f4f5",
  chromeBorder: "#e2e2e5",
  text: "#202024",
  textMuted: "#7a7a82",
  urlBar: "#ffffff",
  urlBarBorder: "#e2e2e5",
};

const dark = {
  chrome: "#24242a",
  chromeBorder: "#3a3a42",
  text: "#f2f2f5",
  textMuted: "#8a8a94",
  urlBar: "#1c1c22",
  urlBarBorder: "#3a3a42",
};

/**
 * Draws only the frame chrome (title bars, URL bar, dynamic island, etc.).
 * Body fill, outer corner radius, and shadow are owned by ScreenshotNode.
 * Positioning convention: (0,0) is the content's top-left.
 */
export default function FrameNodes({ frame, contentWidth, contentHeight }: Props) {
  const def = frameDefs[frame.id];
  if (frame.id === "none" || frame.id === "floating") return null;

  const palette = frame.variant === "dark" ? dark : light;
  const headerH = def.headerHeight;
  const width = contentWidth;

  const windowButtons = frame.controls.showButtons ? (
    <Group x={16} y={headerH / 2 - 6}>
      <Circle x={0} y={6} radius={6} fill="#ff5f57" />
      <Circle x={20} y={6} radius={6} fill="#febc2e" />
      <Circle x={40} y={6} radius={6} fill="#28c840" />
    </Group>
  ) : null;

  if (frame.id === "macos-window") {
    return (
      <Group y={-headerH}>
        <Rect
          x={0}
          y={0}
          width={width}
          height={headerH}
          fill={palette.chrome}
          cornerRadius={[def.cornerRadius, def.cornerRadius, 0, 0]}
        />
        <Rect x={0} y={headerH - 1} width={width} height={1} fill={palette.chromeBorder} />
        {windowButtons}
        <Text
          x={0}
          y={headerH / 2 - 6}
          width={width}
          align="center"
          text={frame.controls.tabTitle}
          fontSize={12}
          fontStyle="500"
          fontFamily="Inter, system-ui, sans-serif"
          fill={palette.textMuted}
        />
      </Group>
    );
  }

  if (frame.id === "browser-chrome") {
    const tabW = Math.min(240, Math.max(120, width * 0.28));
    const urlY = 40;
    const urlH = 26;
    return (
      <Group y={-headerH}>
        <Rect
          x={0}
          y={0}
          width={width}
          height={headerH}
          fill={palette.chrome}
          cornerRadius={[def.cornerRadius, def.cornerRadius, 0, 0]}
        />
        {windowButtons}
        <Rect
          x={80}
          y={8}
          width={tabW}
          height={30}
          fill={palette.urlBar}
          cornerRadius={[10, 10, 0, 0]}
        />
        <Text
          x={94}
          y={17}
          width={tabW - 26}
          text={frame.controls.tabTitle}
          fontSize={12}
          fontStyle="500"
          fontFamily="Inter, system-ui, sans-serif"
          fill={palette.text}
          ellipsis
          wrap="none"
        />
        <Rect x={0} y={38} width={width} height={1} fill={palette.chromeBorder} />
        <Rect
          x={14}
          y={urlY}
          width={width - 28}
          height={urlH}
          fill={palette.urlBar}
          stroke={palette.urlBarBorder}
          strokeWidth={1}
          cornerRadius={urlH / 2}
        />
        <Text
          x={28}
          y={urlY + urlH / 2 - 5}
          width={width - 56}
          text={frame.controls.url}
          fontSize={11}
          fontFamily="Inter, system-ui, sans-serif"
          fill={palette.textMuted}
        />
        <Rect x={0} y={headerH - 1} width={width} height={1} fill={palette.chromeBorder} />
      </Group>
    );
  }

  if (frame.id === "browser-safari") {
    const urlW = Math.min(260, width * 0.36);
    const urlH = 24;
    return (
      <Group y={-headerH}>
        <Rect
          x={0}
          y={0}
          width={width}
          height={headerH}
          fill={palette.chrome}
          cornerRadius={[def.cornerRadius, def.cornerRadius, 0, 0]}
        />
        {windowButtons}
        <Rect
          x={width / 2 - urlW / 2}
          y={headerH / 2 - urlH / 2}
          width={urlW}
          height={urlH}
          fill={palette.urlBar}
          stroke={palette.urlBarBorder}
          strokeWidth={1}
          cornerRadius={6}
        />
        <Text
          x={width / 2 - urlW / 2 + 10}
          y={headerH / 2 - 5}
          width={urlW - 20}
          align="center"
          text={frame.controls.url}
          fontSize={11}
          fontFamily="Inter, system-ui, sans-serif"
          fill={palette.textMuted}
        />
        <Rect x={0} y={headerH - 1} width={width} height={1} fill={palette.chromeBorder} />
      </Group>
    );
  }

  if (frame.id === "iphone-15-pro") {
    const island = { w: Math.min(126, contentWidth * 0.35), h: 32 };
    return (
      <Group>
        {/* subtle inner bezel highlight */}
        <Rect
          x={-1}
          y={-1}
          width={contentWidth + 2}
          height={contentHeight + 2}
          cornerRadius={def.contentCornerRadius + 1}
          stroke="#2a2a2e"
          strokeWidth={1}
          listening={false}
        />
        {/* Dynamic Island */}
        <Rect
          x={contentWidth / 2 - island.w / 2}
          y={12}
          width={island.w}
          height={island.h}
          fill="#000000"
          cornerRadius={island.h / 2}
          listening={false}
        />
      </Group>
    );
  }

  if (frame.id === "mbp-14") {
    const cameraY = -def.bezelPad / 2;
    return (
      <Group>
        {/* subtle inner bezel rim */}
        <Rect
          x={-1}
          y={-1}
          width={contentWidth + 2}
          height={contentHeight + 2}
          cornerRadius={def.contentCornerRadius + 1}
          stroke="#26262a"
          strokeWidth={1}
          listening={false}
        />
        {/* camera dot in top bezel */}
        <Circle x={contentWidth / 2} y={cameraY} radius={2.2} fill="#111114" listening={false} />
      </Group>
    );
  }

  return null;
}
