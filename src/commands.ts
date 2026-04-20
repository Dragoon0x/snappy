import { copyExport, downloadExport } from "@/lib/export";
import { canvasPresets } from "@/lib/presets/canvas";
import { frameList } from "@/lib/presets/frames";
import { gradientPresets } from "@/lib/presets/gradients";
import { shaderPresets } from "@/lib/presets/shaders";
import { applyTemplate, templates } from "@/lib/presets/templates";
import { redo, undo, useDocumentStore } from "@/store/documentStore";
import { type PanelId, useEditorStore } from "@/store/editorStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { FrameId } from "@/types/document";
import type Konva from "konva";

export type Command = {
  id: string;
  title: string;
  subtitle?: string;
  group: string;
  keywords?: string[];
  shortcut?: string;
  run: () => void | Promise<void>;
};

type CommandCtx = {
  stageRef: React.MutableRefObject<Konva.Stage | null>;
};

export function buildCommands(ctx: CommandCtx): Command[] {
  const cmds: Command[] = [];

  cmds.push(
    {
      id: "undo",
      title: "Undo",
      group: "Edit",
      shortcut: "Mod+Z",
      run: () => undo(),
    },
    {
      id: "redo",
      title: "Redo",
      group: "Edit",
      shortcut: "Mod+Shift+Z",
      run: () => redo(),
    },
  );

  const baseName = () =>
    useDocumentStore.getState().doc.name.toLowerCase().replace(/\s+/g, "-") || "snappy";

  cmds.push({
    id: "export-png",
    title: "Export PNG",
    group: "File",
    shortcut: "Mod+E",
    run: async () => {
      await downloadExport({
        doc: useDocumentStore.getState().doc,
        stage: ctx.stageRef.current,
        format: "png",
        pixelRatio: 2,
        quality: 1,
        filename: baseName(),
      });
    },
  });

  for (const ratio of [1, 2, 3, 4]) {
    cmds.push({
      id: `export-png-${ratio}x`,
      title: `Export PNG @${ratio}x`,
      group: "File",
      run: async () => {
        await downloadExport({
          doc: useDocumentStore.getState().doc,
          stage: ctx.stageRef.current,
          format: "png",
          pixelRatio: ratio,
          quality: 1,
          filename: baseName(),
        });
      },
    });
  }

  cmds.push({
    id: "export-jpg",
    title: "Export JPG",
    group: "File",
    run: async () => {
      await downloadExport({
        doc: useDocumentStore.getState().doc,
        stage: ctx.stageRef.current,
        format: "jpg",
        pixelRatio: 2,
        quality: 0.92,
        filename: baseName(),
      });
    },
  });

  cmds.push({
    id: "export-webp",
    title: "Export WebP",
    group: "File",
    run: async () => {
      await downloadExport({
        doc: useDocumentStore.getState().doc,
        stage: ctx.stageRef.current,
        format: "webp",
        pixelRatio: 2,
        quality: 0.92,
        filename: baseName(),
      });
    },
  });

  cmds.push({
    id: "copy-clipboard",
    title: "Copy to clipboard",
    group: "File",
    shortcut: "Mod+Shift+C",
    run: async () => {
      await copyExport({
        doc: useDocumentStore.getState().doc,
        stage: ctx.stageRef.current,
        format: "png",
        pixelRatio: 2,
        quality: 1,
        filename: baseName(),
      });
    },
  });

  for (const f of frameList) {
    cmds.push({
      id: `frame-${f.id}`,
      title: `Frame: ${f.label}`,
      group: "Frame",
      keywords: ["device", "window", f.category],
      run: () => {
        useDocumentStore.getState().setFrame({ id: f.id as FrameId });
      },
    });
  }

  for (const g of gradientPresets) {
    cmds.push({
      id: `bg-${g.id}`,
      title: `Background: ${g.name}`,
      group: "Background",
      keywords: ["gradient", "color"],
      run: () => useDocumentStore.getState().setBackground(g.background),
    });
  }

  for (const s of shaderPresets) {
    cmds.push({
      id: `shader-${s.id}`,
      title: `Shader: ${s.name}`,
      group: "Background",
      keywords: ["shader", "webgl", s.source],
      run: () =>
        useDocumentStore.getState().setBackground({
          kind: "shader",
          presetId: s.id,
          params: { ...s.defaults },
          seed: Math.random() * 1000,
        }),
    });
  }

  for (const t of templates) {
    cmds.push({
      id: `template-${t.id}`,
      title: `Template: ${t.name}`,
      subtitle: t.description,
      group: "Templates",
      keywords: [t.category],
      run: () => {
        const s = useDocumentStore.getState();
        const result = applyTemplate(t, {
          frame: s.doc.screenshot.frame,
          screenshot: s.doc.screenshot,
        });
        s.apply((draft) => {
          draft.canvas = result.canvas;
          draft.background = result.background;
          draft.screenshot.frame = result.frame;
          draft.screenshot.padding = result.screenshot.padding;
          draft.screenshot.cornerRadius = result.screenshot.cornerRadius;
          draft.screenshot.rotation = result.screenshot.rotation;
          draft.screenshot.scale = result.screenshot.scale;
          draft.screenshot.shadow = result.screenshot.shadow;
        });
      },
    });
  }

  cmds.push({
    id: "open-templates",
    title: "Open Templates gallery",
    group: "Templates",
    shortcut: "Mod+T",
    run: () => useEditorStore.getState().openTemplates(),
  });

  for (const p of canvasPresets) {
    cmds.push({
      id: `canvas-${p.id}`,
      title: `Canvas: ${p.label}`,
      subtitle: `${p.width}×${p.height}`,
      group: "Canvas",
      run: () => useDocumentStore.getState().setCanvasSize(p.width, p.height, p.id),
    });
  }

  const setActivePanel = (panel: PanelId) => useEditorStore.getState().setActivePanel(panel);
  cmds.push(
    {
      id: "panel-background",
      title: "Open Background panel",
      group: "View",
      run: () => setActivePanel("background"),
    },
    {
      id: "panel-frame",
      title: "Open Frame panel",
      group: "View",
      run: () => setActivePanel("frame"),
    },
    {
      id: "panel-inspector",
      title: "Open Inspector panel",
      group: "View",
      run: () => setActivePanel("inspector"),
    },
    {
      id: "panel-export",
      title: "Open Export panel",
      group: "View",
      run: () => setActivePanel("export"),
    },
  );

  cmds.push(
    {
      id: "theme-dark",
      title: "Theme: Dark",
      group: "View",
      run: () => useSettingsStore.getState().setTheme("dark"),
    },
    {
      id: "theme-light",
      title: "Theme: Light",
      group: "View",
      run: () => useSettingsStore.getState().setTheme("light"),
    },
    {
      id: "theme-system",
      title: "Theme: System",
      group: "View",
      run: () => useSettingsStore.getState().setTheme("system"),
    },
  );

  cmds.push({
    id: "open-onboarding",
    title: "Show welcome tour",
    group: "Help",
    run: () => useEditorStore.getState().openOnboarding(),
  });

  cmds.push({
    id: "view-2d",
    title: "View: 2D",
    group: "View",
    run: () => useDocumentStore.getState().setViewMode("2d"),
  });
  cmds.push({
    id: "view-3d",
    title: "View: 3D scene",
    group: "View",
    shortcut: "3",
    run: () => useDocumentStore.getState().setViewMode("3d"),
  });
  for (const p of ["hero", "floating", "angled", "isometric"] as const) {
    cmds.push({
      id: `three-preset-${p}`,
      title: `3D preset: ${p[0]!.toUpperCase()}${p.slice(1)}`,
      group: "View",
      run: () => {
        useDocumentStore.getState().setViewMode("3d");
        useDocumentStore.getState().setThreeConfig({ preset: p });
      },
    });
  }

  cmds.push({
    id: "reset-scene",
    title: "Reset scene",
    group: "Edit",
    run: () => useDocumentStore.getState().reset(),
  });

  return cmds;
}
