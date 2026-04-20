import { shaderPresetMap } from "@/lib/presets/shaders";
import type Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image as KImage } from "react-konva";
import { type CompiledShader, compile, hexToRgb, render } from "../shaders/runtime";
import { SHADER_SOURCES, type ShaderSourceId } from "../shaders/sources";

type Props = {
  width: number;
  height: number;
  presetId: string;
  params: Record<string, string | number>;
  seed: number;
};

export default function ShaderBackgroundNode({ width, height, presetId, params, seed }: Props) {
  const preset = shaderPresetMap.get(presetId);
  const shaderRef = useRef<CompiledShader | null>(null);
  const currentSourceRef = useRef<ShaderSourceId | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const imageRef = useRef<Konva.Image | null>(null);

  const sourceId = preset?.source ?? "mesh-gradient";

  const uniforms = useMemo(() => {
    if (!preset) return { u_seed: seed };
    const merged: Record<string, number | [number, number, number]> = { u_seed: seed };
    for (const spec of preset.params) {
      const value = params[spec.key] ?? preset.defaults[spec.key];
      if (spec.kind === "color") {
        merged[spec.key] = hexToRgb(typeof value === "string" ? value : spec.default);
      } else {
        merged[spec.key] = typeof value === "number" ? value : spec.default;
      }
    }
    return merged;
  }, [preset, params, seed]);

  useEffect(() => {
    if (!preset) return;
    if (currentSourceRef.current !== sourceId || !shaderRef.current) {
      shaderRef.current?.destroy();
      try {
        shaderRef.current = compile(SHADER_SOURCES[sourceId], width, height);
        currentSourceRef.current = sourceId;
      } catch (err) {
        console.warn("Shader compile failed", err);
        shaderRef.current = null;
      }
    }
    const shader = shaderRef.current;
    if (!shader) return;
    try {
      const result = render(shader, uniforms, { width, height });
      setCanvas(result);
      if (imageRef.current) {
        imageRef.current.image(result);
        imageRef.current.getLayer()?.batchDraw();
      }
    } catch (err) {
      console.warn("Shader render failed", err);
    }
  }, [preset, sourceId, width, height, uniforms]);

  useEffect(() => {
    return () => {
      shaderRef.current?.destroy();
      shaderRef.current = null;
    };
  }, []);

  if (!canvas) return null;

  return (
    <KImage
      ref={imageRef}
      image={canvas}
      x={0}
      y={0}
      width={width}
      height={height}
      listening={false}
    />
  );
}
