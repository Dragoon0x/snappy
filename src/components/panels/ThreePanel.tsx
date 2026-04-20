import { useDocumentStore } from "@/store/documentStore";
import type { ThreeEnvironment, ThreePreset } from "@/types/document";
import ColorInput from "../ui/ColorInput";
import Segmented from "../ui/Segmented";
import Slider from "../ui/Slider";

const presetOptions: { value: ThreePreset; label: string }[] = [
  { value: "hero", label: "Hero" },
  { value: "floating", label: "Floating" },
  { value: "angled", label: "Angled" },
  { value: "isometric", label: "Iso" },
];

const envOptions: { id: ThreeEnvironment; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "city", label: "City" },
  { id: "sunset", label: "Sunset" },
  { id: "warehouse", label: "Warehouse" },
  { id: "apartment", label: "Apartment" },
  { id: "night", label: "Night" },
];

export default function ThreePanel() {
  const three = useDocumentStore((s) => s.doc.three);
  const bg = useDocumentStore((s) => s.doc.background);
  const setThree = useDocumentStore((s) => s.setThreeConfig);
  const setBackground = useDocumentStore((s) => s.setBackground);

  return (
    <div className="flex flex-col">
      <div className="panel-section">
        <div className="panel-label">Camera preset</div>
        <Segmented<ThreePreset>
          fullWidth
          value={three.preset}
          options={presetOptions}
          onChange={(preset) => setThree({ preset })}
        />
      </div>

      <div className="panel-section space-y-2">
        <div className="panel-label">Environment</div>
        <div className="grid grid-cols-3 gap-2">
          {envOptions.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setThree({ environment: e.id })}
              className={
                three.environment === e.id
                  ? "surface-2 border border-accent rounded-md py-2 text-xs"
                  : "bg-transparent border border-border rounded-md py-2 text-xs hover:bg-surface-2"
              }
            >
              {e.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted leading-snug">
          HDR-style reflections baked into the frame's clearcoat.
        </p>
      </div>

      <div className="panel-section space-y-3">
        <div className="panel-label">Tilt</div>
        <Slider
          label="X"
          min={-45}
          max={45}
          value={three.tiltX}
          unit="°"
          onChange={(tiltX) => setThree({ tiltX })}
        />
        <Slider
          label="Y"
          min={-60}
          max={60}
          value={three.tiltY}
          unit="°"
          onChange={(tiltY) => setThree({ tiltY })}
        />
        <Slider
          label="Z"
          min={-45}
          max={45}
          value={three.tiltZ}
          unit="°"
          onChange={(tiltZ) => setThree({ tiltZ })}
        />
      </div>

      <div className="panel-section space-y-3">
        <div className="panel-label">Scene</div>
        <Slider
          label="Distance"
          min={0.6}
          max={1.6}
          step={0.01}
          value={three.distance}
          onChange={(distance) => setThree({ distance })}
        />
        <Slider
          label="Elevation"
          min={-0.3}
          max={0.3}
          step={0.01}
          value={three.elevation}
          onChange={(elevation) => setThree({ elevation })}
        />
        <Slider
          label="Shadow"
          min={0}
          max={1}
          step={0.01}
          value={three.shadowStrength}
          onChange={(shadowStrength) => setThree({ shadowStrength })}
        />
        <Slider
          label="Bloom"
          min={0}
          max={1}
          step={0.01}
          value={three.bloom}
          onChange={(bloom) => setThree({ bloom })}
        />
      </div>

      {bg.kind === "solid" || bg.kind === "transparent" ? (
        <div className="panel-section space-y-2">
          <div className="panel-label">Background color</div>
          <ColorInput
            value={bg.kind === "solid" ? bg.color : "#111111"}
            onChange={(color) => setBackground({ kind: "solid", color })}
          />
        </div>
      ) : null}
    </div>
  );
}
