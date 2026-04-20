import { frameDefs } from "@/lib/presets/frames";
import type { FrameSpec } from "@/types/document";
import type { Ctx2D } from "./types";
import { roundedRectPath } from "./util";

const light = {
  chrome: "#f4f4f5",
  chromeBorder: "#e2e2e5",
  text: "#202024",
  textMuted: "#7a7a82",
  urlBar: "#ffffff",
  urlBarBorder: "#e2e2e5",
};

const dark = {
  chrome: "#24242a",
  chromeBorder: "#3a3a42",
  text: "#f2f2f5",
  textMuted: "#8a8a94",
  urlBar: "#1c1c22",
  urlBarBorder: "#3a3a42",
};

function fillCircle(ctx: Ctx2D, cx: number, cy: number, r: number, fill: string): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function fillTextAt(
  ctx: Ctx2D,
  text: string,
  x: number,
  y: number,
  options: {
    font: string;
    fill: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    maxWidth?: number;
  },
): void {
  ctx.save();
  ctx.font = options.font;
  ctx.fillStyle = options.fill;
  ctx.textAlign = options.align ?? "left";
  ctx.textBaseline = options.baseline ?? "top";
  if (options.maxWidth !== undefined) {
    const measured = ctx.measureText(text);
    if (measured.width > options.maxWidth) {
      let trimmed = text;
      while (trimmed.length > 0 && ctx.measureText(trimmed + "…").width > options.maxWidth) {
        trimmed = trimmed.slice(0, -1);
      }
      ctx.fillText(trimmed + "…", x, y);
      ctx.restore();
      return;
    }
  }
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * Draw the frame chrome (title bars, URL bar, dynamic island) assuming
 * context origin is at the content's top-left.
 */
export function renderFrame(
  ctx: Ctx2D,
  frame: FrameSpec,
  contentWidth: number,
  contentHeight: number,
): void {
  if (frame.id === "none" || frame.id === "floating") return;

  const def = frameDefs[frame.id];
  const palette = frame.variant === "dark" ? dark : light;
  const headerH = def.headerHeight;
  const width = contentWidth;

  const drawWindowButtons = (x: number, y: number) => {
    if (!frame.controls.showButtons) return;
    fillCircle(ctx, x + 0, y + 6, 6, "#ff5f57");
    fillCircle(ctx, x + 20, y + 6, 6, "#febc2e");
    fillCircle(ctx, x + 40, y + 6, 6, "#28c840");
  };

  if (frame.id === "macos-window") {
    // header bar
    ctx.save();
    roundedRectPath(ctx, 0, -headerH, width, headerH, [def.cornerRadius, def.cornerRadius, 0, 0]);
    ctx.fillStyle = palette.chrome;
    ctx.fill();
    ctx.restore();

    // header border
    ctx.fillStyle = palette.chromeBorder;
    ctx.fillRect(0, -1, width, 1);

    drawWindowButtons(16, -headerH + headerH / 2 - 6);

    fillTextAt(ctx, frame.controls.tabTitle, width / 2, -headerH / 2, {
      font: "500 12px Inter, system-ui, sans-serif",
      fill: palette.textMuted,
      align: "center",
      baseline: "middle",
    });
    return;
  }

  if (frame.id === "browser-chrome") {
    const tabW = Math.min(240, Math.max(120, width * 0.28));
    const urlY = -headerH + 40;
    const urlH = 26;

    ctx.save();
    roundedRectPath(ctx, 0, -headerH, width, headerH, [def.cornerRadius, def.cornerRadius, 0, 0]);
    ctx.fillStyle = palette.chrome;
    ctx.fill();
    ctx.restore();

    drawWindowButtons(16, -headerH + 12);

    // tab
    ctx.save();
    roundedRectPath(ctx, 80, -headerH + 8, tabW, 30, [10, 10, 0, 0]);
    ctx.fillStyle = palette.urlBar;
    ctx.fill();
    ctx.restore();
    fillTextAt(ctx, frame.controls.tabTitle, 94, -headerH + 22, {
      font: "500 12px Inter, system-ui, sans-serif",
      fill: palette.text,
      align: "left",
      baseline: "middle",
      maxWidth: tabW - 26,
    });

    // separator
    ctx.fillStyle = palette.chromeBorder;
    ctx.fillRect(0, -headerH + 38, width, 1);

    // URL bar
    ctx.save();
    roundedRectPath(ctx, 14, urlY, width - 28, urlH, urlH / 2);
    ctx.fillStyle = palette.urlBar;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = palette.urlBarBorder;
    ctx.stroke();
    ctx.restore();
    fillTextAt(ctx, frame.controls.url, 28, urlY + urlH / 2, {
      font: "10px Inter, system-ui, sans-serif",
      fill: palette.textMuted,
      align: "left",
      baseline: "middle",
      maxWidth: width - 56,
    });

    ctx.fillStyle = palette.chromeBorder;
    ctx.fillRect(0, -1, width, 1);
    return;
  }

  if (frame.id === "browser-safari") {
    const urlW = Math.min(260, width * 0.36);
    const urlH = 24;

    ctx.save();
    roundedRectPath(ctx, 0, -headerH, width, headerH, [def.cornerRadius, def.cornerRadius, 0, 0]);
    ctx.fillStyle = palette.chrome;
    ctx.fill();
    ctx.restore();

    drawWindowButtons(16, -headerH + headerH / 2 - 6);

    ctx.save();
    roundedRectPath(ctx, width / 2 - urlW / 2, -headerH / 2 - urlH / 2, urlW, urlH, 6);
    ctx.fillStyle = palette.urlBar;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = palette.urlBarBorder;
    ctx.stroke();
    ctx.restore();

    fillTextAt(ctx, frame.controls.url, width / 2, -headerH / 2, {
      font: "11px Inter, system-ui, sans-serif",
      fill: palette.textMuted,
      align: "center",
      baseline: "middle",
      maxWidth: urlW - 20,
    });

    ctx.fillStyle = palette.chromeBorder;
    ctx.fillRect(0, -1, width, 1);
    return;
  }

  if (frame.id === "iphone-15-pro") {
    // Dynamic Island positioned over the content, inset from top.
    const islandW = Math.min(126, contentWidth * 0.35);
    const islandH = 32;
    ctx.save();
    roundedRectPath(ctx, contentWidth / 2 - islandW / 2, 12, islandW, islandH, islandH / 2);
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.restore();

    // inner bezel rim
    ctx.save();
    roundedRectPath(ctx, -1, -1, contentWidth + 2, contentHeight + 2, def.contentCornerRadius + 1);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#2a2a2e";
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (frame.id === "mbp-14") {
    const cameraY = -def.bezelPad / 2;
    // bezel rim
    ctx.save();
    roundedRectPath(ctx, -1, -1, contentWidth + 2, contentHeight + 2, def.contentCornerRadius + 1);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#26262a";
    ctx.stroke();
    ctx.restore();
    // camera dot
    fillCircle(ctx, contentWidth / 2, cameraY, 2.2, "#111114");
    return;
  }
}
