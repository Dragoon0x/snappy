import { showToast } from "@/components/Toast";
import { extractPalette } from "@/lib/palette/extract";
import { harmoniseToBackground } from "@/lib/palette/harmonize";
import { gradientPresets } from "@/lib/presets/gradients";
import { shaderPresetMap, shaderPresets } from "@/lib/presets/shaders";
import { useAssetStore } from "@/store/assetStore";
import { useDocumentStore } from "@/store/documentStore";
import type { Background } from "@/types/document";
import { Shuffle, Wand2 } from "lucide-react";
import { useState } from "react";
import ColorInput from "../ui/ColorInput";
import Segmented from "../ui/Segmented";
import Slider from "../ui/Slider";

export default function BackgroundPanel() {
  const bg = useDocumentStore((s) => s.doc.background);
  const setBackground = useDocumentStore((s) => s.setBackground);
  const assetId = useDocumentStore((s) => s.doc.screenshot.assetId);
  const assetEntry = useAssetStore((s) => (assetId ? s.cache.get(assetId) : null));
  const [matching, setMatching] = useState(false);

  const kind = bg.kind;

  const matchToScreenshot = async () => {
    if (!assetEntry?.image || matching) return;
    setMatching(true);
    try {
      const palette = await extractPalette(assetEntry.image, { k: 5, sampleSize: 96 });
      const nextBg = harmoniseToBackground(palette);
      setBackground(nextBg);
      showToast("Background matched to screenshot");
    } catch (err) {
      console.warn(err);
      showToast(err instanceof Error ? err.message : "Couldn't extract palette", "error");
    } finally {
      setMatching(false);
    }
  };

  return (
    <div className="flex flex-col">
      {assetEntry?.image ? (
        <div className="panel-section">
          <button
            type="button"
            onClick={matchToScreenshot}
            disabled={matching}
            className="btn-ghost w-full justify-center border border-border"
            title="Extract a palette from the screenshot and set it as the background gradient"
          >
            <Wand2 size={14} />
            {matching ? "Matching…" : "Match background to screenshot"}
          </button>
        </div>
      ) : null}

      <div className="panel-section">
        <div className="panel-label">Type</div>
        <Segmented<Background["kind"]>
          fullWidth
          value={kind}
          options={[
            { value: "linearGradient", label: "Gradient" },
            { value: "shader", label: "Shader" },
            { value: "solid", label: "Solid" },
            { value: "transparent", label: "None" },
          ]}
          onChange={(nextKind) => {
            if (nextKind === "solid") return setBackground({ kind: "solid", color: "#111111" });
            if (nextKind === "transparent") return setBackground({ kind: "transparent" });
            if (nextKind === "shader") {
              const first = shaderPresets[0];
              if (!first) return;
              return setBackground({
                kind: "shader",
                presetId: first.id,
                params: { ...first.defaults },
                seed: 1,
              });
            }
            const first = gradientPresets[0];
            if (first) setBackground(first.background);
          }}
        />
      </div>

      {kind === "linearGradient" ? (
        <div className="panel-section space-y-3">
          <div>
            <div className="panel-label">Presets</div>
            <div className="grid grid-cols-4 gap-2">
              {gradientPresets.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setBackground(g.background)}
                  title={g.name}
                  className="aspect-square rounded-lg border border-border hover:ring-2 hover:ring-accent transition-shadow overflow-hidden"
                  style={{ background: g.preview }}
                />
              ))}
            </div>
          </div>
          <Slider
            label="Angle"
            min={0}
            max={360}
            value={bg.angle}
            unit="°"
            onChange={(angle) => setBackground({ ...bg, angle })}
          />
          <div className="space-y-2">
            <div className="panel-label">Colors</div>
            {bg.stops.map((stop, i) => (
              <ColorInput
                key={`${stop.color}-${i}`}
                value={stop.color}
                onChange={(color) => {
                  const stops = bg.stops.map((s, idx) => (idx === i ? { ...s, color } : s));
                  setBackground({ ...bg, stops });
                }}
              />
            ))}
          </div>
        </div>
      ) : null}

      {kind === "solid" ? (
        <div className="panel-section space-y-3">
          <ColorInput
            label="Color"
            value={bg.color}
            onChange={(color) => setBackground({ kind: "solid", color })}
          />
        </div>
      ) : null}

      {kind === "meshGradient" ? (
        <div className="panel-section space-y-2">
          <div className="panel-label">Colors</div>
          {bg.colors.map((c, i) => (
            <ColorInput
              key={`mesh-${i}`}
              value={c}
              onChange={(color) => {
                const next = [...bg.colors] as typeof bg.colors;
                next[i] = color;
                setBackground({ ...bg, colors: next });
              }}
            />
          ))}
        </div>
      ) : null}

      {kind === "shader" ? <ShaderControls /> : null}
    </div>
  );
}

function ShaderControls() {
  const bg = useDocumentStore((s) => s.doc.background);
  const setBackground = useDocumentStore((s) => s.setBackground);
  if (bg.kind !== "shader") return null;

  const preset = shaderPresetMap.get(bg.presetId) ?? shaderPresets[0];
  if (!preset) return null;

  const setParam = (key: string, value: string | number) => {
    setBackground({ ...bg, params: { ...bg.params, [key]: value } });
  };
  const applyPreset = (id: string) => {
    const p = shaderPresetMap.get(id);
    if (!p) return;
    setBackground({
      kind: "shader",
      presetId: id,
      params: { ...p.defaults },
      seed: bg.seed,
    });
  };
  const randomize = () => {
    setBackground({ ...bg, seed: Math.random() * 1000 });
  };

  return (
    <>
      <div className="panel-section">
        <div className="panel-label">
          Preset
          <button
            type="button"
            onClick={randomize}
            className="btn-ghost px-1.5 py-0.5"
            title="Randomize seed"
          >
            <Shuffle size={12} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {shaderPresets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              title={p.name}
              className={
                p.id === bg.presetId
                  ? "text-left rounded-lg border border-accent overflow-hidden"
                  : "text-left rounded-lg border border-border hover:border-fg/30 overflow-hidden"
              }
            >
              <span className="block h-14" style={{ background: p.preview }} />
              <span className="block text-[11px] px-2 py-1 truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section space-y-3">
        <div className="panel-label">Parameters</div>
        {preset.params.map((spec) => {
          const current = bg.params[spec.key];
          if (spec.kind === "color") {
            const value = typeof current === "string" ? current : spec.default;
            return (
              <ColorInput
                key={spec.key}
                label={spec.label}
                value={value}
                onChange={(v) => setParam(spec.key, v)}
              />
            );
          }
          const value = typeof current === "number" ? current : spec.default;
          return (
            <Slider
              key={spec.key}
              label={spec.label}
              min={spec.min}
              max={spec.max}
              step={spec.step ?? 0.01}
              value={value}
              onChange={(v) => setParam(spec.key, v)}
            />
          );
        })}
      </div>
    </>
  );
}
