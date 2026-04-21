import { showToast } from "@/components/Toast";
import { applyAutoCropToCurrentAsset } from "@/lib/crop/applyAutoCrop";
import { useDocumentStore } from "@/store/documentStore";
import { useEditorStore } from "@/store/editorStore";
import { Scissors } from "lucide-react";
import { useState } from "react";
import ColorInput from "../ui/ColorInput";
import Slider from "../ui/Slider";
import AnnotationInspector from "./AnnotationInspector";
import ThreePanel from "./ThreePanel";

export default function InspectorPanel() {
  const selectedId = useEditorStore((s) => s.selectedAnnotationId);
  const viewMode = useDocumentStore((s) => s.doc.viewMode);
  if (selectedId) return <AnnotationInspector />;
  if (viewMode === "3d") return <ThreePanel />;
  return <ScreenshotInspector />;
}

function ScreenshotInspector() {
  const ss = useDocumentStore((s) => s.doc.screenshot);
  const setScreenshot = useDocumentStore((s) => s.setScreenshot);
  const setScreenshotShadow = useDocumentStore((s) => s.setScreenshotShadow);
  const [cropping, setCropping] = useState(false);

  const runSmartCrop = async () => {
    if (cropping) return;
    if (!ss.assetId) {
      showToast("Drop or paste a screenshot first", "error");
      return;
    }
    setCropping(true);
    try {
      const result = await applyAutoCropToCurrentAsset();
      if (!result.cropped) {
        showToast("No chrome detected — image left unchanged");
      } else if (result.rect) {
        const pct = Math.round(
          100 *
            (1 -
              (result.rect.width * result.rect.height) /
                (result.originalWidth * result.originalHeight)),
        );
        showToast(`Cropped ${pct}% of chrome`);
      }
    } catch (err) {
      console.warn(err);
      showToast(err instanceof Error ? err.message : "Smart crop failed", "error");
    } finally {
      setCropping(false);
    }
  };

  return (
    <div className="flex flex-col">
      {ss.assetId ? (
        <div className="panel-section">
          <button
            type="button"
            onClick={runSmartCrop}
            disabled={cropping}
            className="btn-ghost w-full justify-center border border-border"
            title="Auto-detect and strip OS / browser chrome from the screenshot"
          >
            <Scissors size={14} />
            {cropping ? "Cropping…" : "Smart crop chrome"}
          </button>
        </div>
      ) : null}

      <div className="panel-section space-y-3">
        <div className="panel-label">Layout</div>
        <Slider
          label="Padding"
          min={0}
          max={400}
          value={ss.padding}
          unit="px"
          onChange={(padding) => setScreenshot({ padding })}
        />
        <Slider
          label="Corner radius"
          min={0}
          max={80}
          value={ss.cornerRadius}
          unit="px"
          onChange={(cornerRadius) => setScreenshot({ cornerRadius })}
        />
        <Slider
          label="Scale"
          min={0.2}
          max={2}
          step={0.01}
          value={ss.scale}
          onChange={(scale) => setScreenshot({ scale })}
        />
        <Slider
          label="Rotation"
          min={-45}
          max={45}
          value={ss.rotation}
          unit="°"
          onChange={(rotation) => setScreenshot({ rotation })}
        />
      </div>

      <div className="panel-section space-y-3">
        <div className="panel-label">
          Shadow
          <label className="flex items-center gap-1 normal-case">
            <input
              type="checkbox"
              checked={ss.shadow.enabled}
              onChange={(e) => setScreenshotShadow({ enabled: e.target.checked })}
              className="accent-accent"
            />
            <span className="text-[10px]">Enabled</span>
          </label>
        </div>
        <ColorInput value={ss.shadow.color} onChange={(color) => setScreenshotShadow({ color })} />
        <Slider
          label="Blur"
          min={0}
          max={200}
          value={ss.shadow.blur}
          unit="px"
          onChange={(blur) => setScreenshotShadow({ blur })}
        />
        <Slider
          label="Offset Y"
          min={-80}
          max={120}
          value={ss.shadow.offsetY}
          unit="px"
          onChange={(offsetY) => setScreenshotShadow({ offsetY })}
        />
        <Slider
          label="Offset X"
          min={-80}
          max={80}
          value={ss.shadow.offsetX}
          unit="px"
          onChange={(offsetX) => setScreenshotShadow({ offsetX })}
        />
        <Slider
          label="Opacity"
          min={0}
          max={1}
          step={0.01}
          value={ss.shadow.opacity}
          onChange={(opacity) => setScreenshotShadow({ opacity })}
        />
      </div>
    </div>
  );
}
