import { useAssetStore } from "@/store/assetStore";
import type { Background } from "@/types/document";
import { Group, Image as KImage, Rect } from "react-konva";
import ShaderBackgroundNode from "./backgrounds/ShaderBackgroundNode";
import { flattenGradientStops, linearGradientPoints } from "./gradientMath";

type Props = {
  width: number;
  height: number;
  background: Background;
};

export default function BackgroundNode({ width, height, background }: Props) {
  if (background.kind === "transparent") {
    return null;
  }

  if (background.kind === "solid") {
    return <Rect x={0} y={0} width={width} height={height} fill={background.color} />;
  }

  if (background.kind === "linearGradient") {
    const { start, end } = linearGradientPoints(width, height, background.angle);
    return (
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fillLinearGradientStartPoint={start}
        fillLinearGradientEndPoint={end}
        fillLinearGradientColorStops={flattenGradientStops(background.stops)}
      />
    );
  }

  if (background.kind === "radialGradient") {
    const r = Math.hypot(width, height) / 2;
    return (
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fillRadialGradientStartPoint={{ x: width * background.cx, y: height * background.cy }}
        fillRadialGradientEndPoint={{ x: width * background.cx, y: height * background.cy }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={r}
        fillRadialGradientColorStops={flattenGradientStops(background.stops)}
      />
    );
  }

  if (background.kind === "meshGradient") {
    const [a, b, c, d] = background.colors;
    return (
      <Group>
        <Rect x={0} y={0} width={width} height={height} fill={a} />
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: width, y: 0 }}
          fillLinearGradientColorStops={[0, `${a}ff`, 1, `${b}00`]}
        />
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: height }}
          fillLinearGradientColorStops={[0, `${c}00`, 1, `${d}cc`]}
          globalCompositeOperation="source-over"
        />
      </Group>
    );
  }

  if (background.kind === "shader") {
    return (
      <ShaderBackgroundNode
        width={width}
        height={height}
        presetId={background.presetId}
        params={background.params}
        seed={background.seed}
      />
    );
  }

  if (background.kind === "image") {
    return <BackgroundImageNode width={width} height={height} background={background} />;
  }

  return null;
}

function BackgroundImageNode({
  width,
  height,
  background,
}: {
  width: number;
  height: number;
  background: Extract<Background, { kind: "image" }>;
}) {
  const entry = useAssetStore((s) => s.cache.get(background.assetId));
  if (!entry?.image) return null;

  const iw = entry.width;
  const ih = entry.height;
  let drawW = width;
  let drawH = height;
  let drawX = 0;
  let drawY = 0;

  if (background.fit === "cover") {
    const scale = Math.max(width / iw, height / ih);
    drawW = iw * scale;
    drawH = ih * scale;
    drawX = (width - drawW) / 2;
    drawY = (height - drawH) / 2;
  } else if (background.fit === "contain") {
    const scale = Math.min(width / iw, height / ih);
    drawW = iw * scale;
    drawH = ih * scale;
    drawX = (width - drawW) / 2;
    drawY = (height - drawH) / 2;
  }

  const filters = background.blur > 0 ? ["blur"] : undefined;

  return (
    <Group clipX={0} clipY={0} clipWidth={width} clipHeight={height}>
      <KImage
        image={entry.image}
        x={drawX}
        y={drawY}
        width={drawW}
        height={drawH}
        filters={filters as never}
        blurRadius={background.blur}
      />
    </Group>
  );
}
