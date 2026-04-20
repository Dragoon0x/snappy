import { cn, modKey } from "@/lib/utils";
import { type ToolId, useEditorStore } from "@/store/editorStore";
import {
  ArrowUpRight,
  Circle as CircleIcon,
  EyeOff,
  MousePointer2,
  Square,
  Type,
} from "lucide-react";

type ToolDef = { id: ToolId; icon: React.ReactNode; label: string; shortcut: string };

const tools: ToolDef[] = [
  { id: "select", icon: <MousePointer2 size={16} />, label: "Select", shortcut: "V" },
  { id: "text", icon: <Type size={16} />, label: "Text", shortcut: "T" },
  { id: "rect", icon: <Square size={16} />, label: "Rectangle", shortcut: "R" },
  { id: "ellipse", icon: <CircleIcon size={16} />, label: "Ellipse", shortcut: "O" },
  { id: "arrow", icon: <ArrowUpRight size={16} />, label: "Arrow", shortcut: "A" },
  { id: "blur", icon: <EyeOff size={16} />, label: "Blur mask", shortcut: "B" },
];

export default function AnnotationToolbar() {
  const tool = useEditorStore((s) => s.tool);
  const setTool = useEditorStore((s) => s.setTool);
  const _mod = modKey();

  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-3 flex flex-col gap-1 surface rounded-lg p-1 shadow-lg">
      {tools.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTool(t.id)}
          title={`${t.label} (${t.shortcut})`}
          className={cn(
            "w-9 h-9 rounded-md flex items-center justify-center transition-colors",
            tool === t.id ? "bg-accent text-bg" : "text-fg/80 hover:bg-surface-2 hover:text-fg",
          )}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
