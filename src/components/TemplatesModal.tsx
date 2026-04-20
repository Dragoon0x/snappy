import { applyTemplate, templates } from "@/lib/presets/templates";
import { useDocumentStore } from "@/store/documentStore";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function TemplatesModal({ open, onClose }: Props) {
  const doc = useDocumentStore((s) => s.doc);
  const apply = useDocumentStore((s) => s.apply);

  if (!open) return null;

  const useTemplate = (id: string) => {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    const result = applyTemplate(tpl, {
      frame: doc.screenshot.frame,
      screenshot: doc.screenshot,
    });
    apply((draft) => {
      draft.canvas = result.canvas;
      draft.background = result.background;
      draft.screenshot.frame = result.frame;
      draft.screenshot.padding = result.screenshot.padding;
      draft.screenshot.cornerRadius = result.screenshot.cornerRadius;
      draft.screenshot.rotation = result.screenshot.rotation;
      draft.screenshot.scale = result.screenshot.scale;
      draft.screenshot.shadow = result.screenshot.shadow;
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-[min(960px,94vw)] max-h-[88vh] overflow-auto surface rounded-xl p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold">Templates</h2>
            <p className="text-xs text-muted">Start from a curated scene.</p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => useTemplate(t.id)}
              className="group text-left rounded-lg border border-border overflow-hidden hover:border-accent transition-colors"
            >
              <div className="h-32 relative" style={{ background: t.preview }}>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                <span className="absolute top-2 left-2 chip bg-black/40 text-white capitalize text-[10px]">
                  {t.category}
                </span>
              </div>
              <div className="p-3">
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-[11px] text-muted mt-0.5 line-clamp-2">{t.description}</div>
                <div className="text-[10px] text-muted mt-1 tabular-nums">
                  {t.canvas.width}×{t.canvas.height}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
