import { frameList } from "@/lib/presets/frames";
import { useDocumentStore } from "@/store/documentStore";
import type { FrameSpec } from "@/types/document";
import Segmented from "../ui/Segmented";

export default function FramePanel() {
  const frame = useDocumentStore((s) => s.doc.screenshot.frame);
  const setFrame = useDocumentStore((s) => s.setFrame);

  return (
    <div className="flex flex-col">
      <div className="panel-section">
        <div className="panel-label">Device / window</div>
        <div className="grid grid-cols-3 gap-2">
          {frameList.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFrame({ id: f.id })}
              className={
                frame.id === f.id
                  ? "surface-2 border border-accent rounded-lg px-2 py-3 text-xs"
                  : "bg-transparent border border-border rounded-lg px-2 py-3 text-xs hover:bg-surface-2"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-label">Appearance</div>
        <Segmented<FrameSpec["variant"]>
          fullWidth
          value={frame.variant}
          options={[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
          ]}
          onChange={(variant) => setFrame({ variant })}
        />
      </div>

      <div className="panel-section space-y-2">
        <div className="panel-label">Controls</div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={frame.controls.showButtons}
            onChange={(e) =>
              setFrame({
                controls: {
                  ...frame.controls,
                  showButtons: e.target.checked,
                },
              })
            }
            className="accent-accent"
          />
          Show window buttons
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted">Tab title</span>
          <input
            type="text"
            value={frame.controls.tabTitle}
            onChange={(e) =>
              setFrame({ controls: { ...frame.controls, tabTitle: e.target.value } })
            }
            className="bg-surface-2 border border-border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted">URL</span>
          <input
            type="text"
            value={frame.controls.url}
            onChange={(e) => setFrame({ controls: { ...frame.controls, url: e.target.value } })}
            className="bg-surface-2 border border-border rounded px-2 py-1 font-mono text-[11px]"
            spellCheck={false}
          />
        </label>
      </div>
    </div>
  );
}
