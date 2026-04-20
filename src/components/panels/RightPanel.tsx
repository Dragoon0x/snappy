import { type PanelId, useEditorStore } from "@/store/editorStore";
import type Konva from "konva";
import { Crop, Image, Palette, Settings2 } from "lucide-react";
import BackgroundPanel from "./BackgroundPanel";
import ExportPanel from "./ExportPanel";
import FramePanel from "./FramePanel";
import InspectorPanel from "./InspectorPanel";

type Props = {
  stageRef: React.MutableRefObject<Konva.Stage | null>;
};

const tabs: { id: PanelId; label: string; icon: React.ReactNode }[] = [
  { id: "background", label: "Background", icon: <Palette size={14} /> },
  { id: "frame", label: "Frame", icon: <Image size={14} /> },
  { id: "inspector", label: "Inspector", icon: <Settings2 size={14} /> },
  { id: "export", label: "Export", icon: <Crop size={14} /> },
];

export default function RightPanel({ stageRef }: Props) {
  const active = useEditorStore((s) => s.activePanel);
  const setActive = useEditorStore((s) => s.setActivePanel);
  const open = useEditorStore((s) => s.isRightPanelOpen);

  if (!open) return null;

  return (
    <aside className="w-[320px] shrink-0 h-full flex flex-col border-l border-border bg-surface">
      <nav className="grid grid-cols-4 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={
              active === t.id
                ? "flex flex-col items-center gap-1 py-2 text-xs text-fg bg-surface-2 border-b-2 border-accent"
                : "flex flex-col items-center gap-1 py-2 text-xs text-muted hover:text-fg border-b-2 border-transparent"
            }
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto">
        {active === "background" ? <BackgroundPanel /> : null}
        {active === "frame" ? <FramePanel /> : null}
        {active === "inspector" ? <InspectorPanel /> : null}
        {active === "export" ? <ExportPanel stageRef={stageRef} /> : null}
      </div>
    </aside>
  );
}
