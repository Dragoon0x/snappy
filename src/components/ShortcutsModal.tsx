import { modKey } from "@/lib/utils";
import { useEditorStore } from "@/store/editorStore";
import { X } from "lucide-react";

type Row = { label: string; keys: string[] };

function shortcutRows(mk: string): Row[] {
  return [
    { label: "Command palette", keys: [mk, "K"] },
    { label: "Export", keys: [mk, "E"] },
    { label: "Copy to clipboard", keys: [mk, "Shift", "C"] },
    { label: "Undo", keys: [mk, "Z"] },
    { label: "Redo", keys: [mk, "Shift", "Z"] },
    { label: "Paste image", keys: [mk, "V"] },
    { label: "Fit to view", keys: ["F"] },
    { label: "Actual size", keys: ["1"] },
    { label: "Zoom in", keys: [mk, "="] },
    { label: "Zoom out", keys: [mk, "-"] },
    { label: "Toggle right panel", keys: [mk, "\\"] },
    { label: "Toggle theme", keys: [mk, "Shift", "D"] },
    { label: "Show shortcuts", keys: ["?"] },
  ];
}

export default function ShortcutsModal() {
  const open = useEditorStore((s) => s.isShortcutsOpen);
  const close = useEditorStore((s) => s.closeShortcuts);
  if (!open) return null;
  const rows = shortcutRows(modKey());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={close}
    >
      <div
        className="w-[min(520px,92vw)] max-h-[80vh] overflow-auto surface rounded-xl p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Keyboard shortcuts</h2>
          <button className="btn-icon" onClick={close}>
            <X size={16} />
          </button>
        </div>
        <ul className="grid grid-cols-1 gap-1 text-sm">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between py-1.5">
              <span className="text-fg/90">{r.label}</span>
              <span className="flex items-center gap-1">
                {r.keys.map((k, i) => (
                  <kbd key={`${r.label}-${i}`} className="kbd px-1.5">
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
