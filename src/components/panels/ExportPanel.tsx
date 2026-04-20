import { copyExport, downloadExport } from "@/lib/export";
import type { ExportFormat } from "@/lib/export/png";
import { isWorkerExportSupported } from "@/lib/export/workerExport";
import { canvasPresets } from "@/lib/presets/canvas";
import { useDocumentStore } from "@/store/documentStore";
import { useEditorStore } from "@/store/editorStore";
import type Konva from "konva";
import { Copy, Download } from "lucide-react";
import { useState } from "react";
import NumberInput from "../ui/NumberInput";
import Segmented from "../ui/Segmented";

type Props = {
  stageRef: React.MutableRefObject<Konva.Stage | null>;
};

export default function ExportPanel({ stageRef }: Props) {
  const doc = useDocumentStore((s) => s.doc);
  const setCanvasSize = useDocumentStore((s) => s.setCanvasSize);
  const setLastFormat = useEditorStore((s) => s.setLastExportFormat);
  const format = useEditorStore((s) => s.lastExportFormat);
  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState(0.95);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleExport = async () => {
    setBusy(true);
    try {
      await downloadExport({
        doc,
        stage: stageRef.current,
        format,
        pixelRatio: scale,
        quality,
        filename: doc.name.toLowerCase().replace(/\s+/g, "-") || "snappy",
      });
      setToast("Downloaded");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 1800);
    }
  };

  const handleCopy = async () => {
    setBusy(true);
    try {
      await copyExport({
        doc,
        stage: stageRef.current,
        format: "png",
        pixelRatio: 2,
        quality: 1,
        filename: doc.name,
      });
      setToast("Copied to clipboard");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Copy failed");
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 1800);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="panel-section space-y-3">
        <div className="panel-label">Canvas size</div>
        <div className="flex gap-2">
          <NumberInput
            label="W"
            value={doc.canvas.width}
            onChange={(w) => setCanvasSize(w, doc.canvas.height)}
            min={200}
            max={8000}
            suffix="px"
          />
          <NumberInput
            label="H"
            value={doc.canvas.height}
            onChange={(h) => setCanvasSize(doc.canvas.width, h)}
            min={200}
            max={8000}
            suffix="px"
          />
        </div>
        <div>
          <div className="panel-label">Presets</div>
          <div className="grid grid-cols-1 gap-1 text-xs max-h-40 overflow-auto">
            {canvasPresets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setCanvasSize(p.width, p.height, p.id)}
                className={
                  doc.canvas.aspectPreset === p.id
                    ? "text-left flex items-center justify-between rounded px-2 py-1.5 surface-2 border border-accent"
                    : "text-left flex items-center justify-between rounded px-2 py-1.5 hover:bg-surface-2"
                }
              >
                <span>{p.label}</span>
                <span className="text-muted">
                  {p.width}×{p.height}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-section space-y-3">
        <div className="panel-label">Format</div>
        <Segmented<ExportFormat>
          fullWidth
          value={format}
          options={[
            { value: "png", label: "PNG" },
            { value: "jpg", label: "JPG" },
            { value: "webp", label: "WebP" },
          ]}
          onChange={setLastFormat}
        />
        <div className="panel-label">Scale</div>
        <Segmented<string>
          fullWidth
          value={String(scale)}
          options={[
            { value: "1", label: "1×" },
            { value: "2", label: "2×" },
            { value: "3", label: "3×" },
            { value: "4", label: "4×" },
          ]}
          onChange={(v) => setScale(Number(v))}
        />
        {format !== "png" ? (
          <div className="space-y-1">
            <div className="panel-label">
              Quality <span>{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.3}
              max={1}
              step={0.01}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
            />
          </div>
        ) : null}
        <div className="text-[11px] text-muted">
          Output: {Math.round(doc.canvas.width * scale)}×{Math.round(doc.canvas.height * scale)} px
        </div>
        <div className="text-[10px] text-muted">
          {isWorkerExportSupported()
            ? "Rendering off-thread via OffscreenCanvas"
            : "Rendering on main thread (worker unavailable)"}
        </div>
      </div>

      <div className="panel-section flex flex-col gap-2">
        <button className="btn-accent w-full justify-center" disabled={busy} onClick={handleExport}>
          <Download size={14} />
          {busy ? "Exporting…" : `Download ${format.toUpperCase()}`}
        </button>
        <button
          className="btn-ghost w-full justify-center border border-border"
          onClick={handleCopy}
        >
          <Copy size={14} />
          Copy to clipboard
        </button>
        {toast ? (
          <div className="text-xs text-accent text-center animate-fade-in">{toast}</div>
        ) : null}
      </div>
    </div>
  );
}
