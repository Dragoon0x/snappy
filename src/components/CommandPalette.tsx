import { buildCommands } from "@/commands";
import { modKey } from "@/lib/utils";
import { useEditorStore } from "@/store/editorStore";
import { Command } from "cmdk";
import type Konva from "konva";
import { useMemo } from "react";

type Props = {
  stageRef: React.MutableRefObject<Konva.Stage | null>;
};

export default function CommandPalette({ stageRef }: Props) {
  const open = useEditorStore((s) => s.isCommandPaletteOpen);
  const close = useEditorStore((s) => s.closeCommandPalette);

  const commands = useMemo(() => buildCommands({ stageRef }), [stageRef]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof commands>();
    for (const c of commands) {
      const list = groups.get(c.group) ?? [];
      list.push(c);
      groups.set(c.group, list);
    }
    return Array.from(groups.entries());
  }, [commands]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={close}
    >
      <Command
        label="Command palette"
        className="w-[min(640px,96vw)] surface rounded-xl overflow-hidden shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <span className="text-muted">⌘</span>
          <Command.Input
            autoFocus
            placeholder="Search commands, frames, gradients…"
            className="bg-transparent outline-none w-full text-sm"
          />
          <kbd className="kbd">Esc</kbd>
        </div>
        <Command.List className="max-h-[52vh] overflow-auto p-1 text-sm">
          <Command.Empty className="py-6 text-center text-muted">No matches</Command.Empty>
          {grouped.map(([group, items]) => (
            <Command.Group key={group} heading={group}>
              {items.map((c) => (
                <Command.Item
                  key={c.id}
                  value={`${c.title} ${c.keywords?.join(" ") ?? ""}`}
                  onSelect={() => {
                    close();
                    queueMicrotask(() => {
                      void c.run();
                    });
                  }}
                  className="px-3 py-2 rounded cursor-pointer flex items-center justify-between gap-2 data-[selected=true]:bg-surface-2"
                >
                  <span className="flex flex-col min-w-0">
                    <span className="truncate">{c.title}</span>
                    {c.subtitle ? (
                      <span className="text-xs text-muted truncate">{c.subtitle}</span>
                    ) : null}
                  </span>
                  {c.shortcut ? (
                    <span className="flex items-center gap-1 text-muted">
                      {c.shortcut.split("+").map((p, i) => (
                        <kbd key={`${c.id}-k-${i}`} className="kbd">
                          {p === "Mod" ? modKey() : p}
                        </kbd>
                      ))}
                    </span>
                  ) : null}
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
