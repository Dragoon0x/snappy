import { cn } from "@/lib/utils";
import { Image, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Props = {
  onFile: (file: File) => void;
  className?: string;
  empty?: boolean;
};

export default function DropZone({ onFile, className, empty }: Props) {
  const [isOver, setIsOver] = useState(false);

  const onDragOver = useCallback((e: DragEvent) => {
    if (!e.dataTransfer) return;
    const hasFiles = Array.from(e.dataTransfer.items).some((it) => it.kind === "file");
    if (!hasFiles) return;
    e.preventDefault();
    setIsOver(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    if (e.target !== window && e.target !== document.body) {
      const related = e.relatedTarget as Node | null;
      if (related && document.body.contains(related)) return;
    }
    setIsOver(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith("image/")) onFile(file);
    },
    [onFile],
  );

  useEffect(() => {
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [onDragOver, onDragLeave, onDrop]);

  return (
    <>
      {empty ? <EmptyOverlay onFile={onFile} /> : null}
      {isOver ? <DragOverlay /> : null}
    </>
  );
}

function DragOverlay() {
  return (
    <div className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-dashed border-accent bg-accent/5 flex items-center justify-center z-30 animate-fade-in">
      <div className="flex flex-col items-center gap-2 text-accent">
        <UploadCloud size={32} />
        <p className="font-medium">Drop image to add</p>
      </div>
    </div>
  );
}

function EmptyOverlay({ onFile }: { onFile: (file: File) => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
      <label className="pointer-events-auto flex flex-col items-center gap-3 p-8 rounded-2xl border border-dashed border-border bg-surface/80 backdrop-blur cursor-pointer hover:border-accent transition-colors shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center">
          <Image size={22} className="text-muted" />
        </div>
        <div className="text-center">
          <p className="font-medium">Drop a screenshot to begin</p>
          <p className="text-xs text-muted mt-1">or paste from clipboard · click to upload</p>
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.currentTarget.value = "";
          }}
        />
      </label>
    </div>
  );
}
