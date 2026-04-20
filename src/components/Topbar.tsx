import { showToast } from "@/components/Toast";
import { copyExport, downloadExport } from "@/lib/export";
import { encodeDocumentForShare } from "@/lib/share/encode";
import { modKey } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { redo, undo, useDocumentStore } from "@/store/documentStore";
import { useEditorStore } from "@/store/editorStore";
import type Konva from "konva";
import {
  Box,
  Command,
  Copy,
  Download,
  Keyboard,
  LayoutTemplate,
  Redo2,
  Share2,
  Sparkles,
  Square,
  Undo2,
} from "lucide-react";
import { useState } from "react";

type Props = {
  stageRef: React.MutableRefObject<Konva.Stage | null>;
};

export default function Topbar({ stageRef }: Props) {
  const doc = useDocumentStore((s) => s.doc);
  const setName = useDocumentStore((s) => s.setName);
  const setViewMode = useDocumentStore((s) => s.setViewMode);
  const openCmd = useEditorStore((s) => s.openCommandPalette);
  const openShortcuts = useEditorStore((s) => s.openShortcuts);
  const openTemplates = useEditorStore((s) => s.openTemplates);
  const lastFormat = useEditorStore((s) => s.lastExportFormat);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await downloadExport({
        doc,
        stage: stageRef.current,
        format: lastFormat,
        pixelRatio: 2,
        quality: 0.95,
        filename: doc.name.replace(/\s+/g, "-").toLowerCase() || "snappy",
      });
      showToast(`Exported ${lastFormat.toUpperCase()}`);
    } catch (err) {
      console.warn(err);
      showToast(err instanceof Error ? err.message : "Export failed", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await copyExport({
        doc,
        stage: stageRef.current,
        format: "png",
        pixelRatio: 2,
        quality: 1,
        filename: doc.name,
      });
      showToast("Copied image to clipboard");
    } catch (err) {
      console.warn(err);
      const msg = err instanceof Error ? err.message : "Clipboard copy failed";
      showToast(
        msg.toLowerCase().includes("permission")
          ? "Clipboard permission denied — check browser settings"
          : msg,
        "error",
      );
    }
  };

  const handleShare = async () => {
    const result = encodeDocumentForShare(doc);
    if (!result.ok) {
      showToast("Scene too complex to share via URL — export JSON instead", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(result.url);
      showToast("Share URL copied to clipboard");
      return;
    } catch (err) {
      console.warn("Clipboard writeText failed, trying execCommand fallback:", err);
    }
    // Fallback for older or restrictive contexts — hidden textarea + execCommand.
    try {
      const ta = document.createElement("textarea");
      ta.value = result.url;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none;left:0;top:0;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (ok) {
        showToast("Share URL copied");
        return;
      }
    } catch {
      /* ignore */
    }
    console.warn("Share URL (clipboard blocked):", result.url);
    showToast("Couldn't access clipboard — URL logged to console", "error");
  };

  return (
    <header className="h-12 flex items-center px-3 border-b border-border bg-surface shrink-0 gap-2">
      <div className="flex items-center gap-2 pr-3 border-r border-border">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-pink-400 via-fuchsia-500 to-indigo-500 flex items-center justify-center shadow-md">
          <Sparkles size={14} className="text-white" />
        </div>
        <span className="font-semibold tracking-tight">Snappy</span>
      </div>

      <input
        aria-label="Document name"
        value={doc.name}
        onChange={(e) => setName(e.target.value)}
        className="bg-transparent text-sm px-2 py-1 rounded hover:bg-surface-2 focus:bg-surface-2 focus:outline-none min-w-[8rem] max-w-[14rem]"
      />

      <div className="flex-1" />

      <div className="flex items-center gap-1 pr-2 border-r border-border">
        <button className="btn-icon" title={`Undo (${modKey()}+Z)`} onClick={() => undo()}>
          <Undo2 size={16} />
        </button>
        <button className="btn-icon" title={`Redo (${modKey()}+Shift+Z)`} onClick={() => redo()}>
          <Redo2 size={16} />
        </button>
      </div>

      <div className="inline-flex items-center rounded-md bg-surface-2 border border-border p-0.5">
        <button
          type="button"
          onClick={() => setViewMode("2d")}
          title="2D view"
          className={cn(
            "px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 transition-colors",
            doc.viewMode === "2d" ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
          )}
        >
          <Square size={12} />
          2D
        </button>
        <button
          type="button"
          onClick={() => setViewMode("3d")}
          title="3D view (3)"
          className={cn(
            "px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 transition-colors",
            doc.viewMode === "3d" ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
          )}
        >
          <Box size={12} />
          3D
        </button>
      </div>

      <button className="btn-ghost" onClick={openTemplates} title={`Templates (${modKey()}+T)`}>
        <LayoutTemplate size={14} />
        <span className="ml-1">Templates</span>
      </button>

      <button className="btn-ghost" onClick={openCmd} title={`Command palette (${modKey()}+K)`}>
        <Command size={14} />
        <span className="ml-1">Commands</span>
      </button>

      <button className="btn-icon" onClick={openShortcuts} title="Keyboard shortcuts (?)">
        <Keyboard size={16} />
      </button>

      <button className="btn-ghost" onClick={handleShare} title="Copy shareable URL (scene only)">
        <Share2 size={14} />
        <span className="ml-1">Share</span>
      </button>

      <button
        className="btn-ghost"
        onClick={handleCopy}
        title={`Copy to clipboard (${modKey()}+Shift+C)`}
      >
        <Copy size={14} />
        <span className="ml-1">Copy</span>
      </button>

      <button
        className="btn-accent"
        onClick={handleExport}
        disabled={exporting}
        title={`Export (${modKey()}+E)`}
      >
        <Download size={14} />
        {exporting ? "Exporting…" : "Export"}
      </button>
    </header>
  );
}
