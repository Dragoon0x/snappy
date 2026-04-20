import { isMac } from "@/lib/utils";
import { useEffect } from "react";

export type HotkeySpec = {
  /**
   * Use "mod" as a cross-platform shorthand for Cmd on mac and Ctrl elsewhere.
   * Examples: "mod+k", "mod+shift+z", "space", "escape", "?"
   */
  keys: string;
  handler: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
  /**
   * When true, the hotkey fires even while an input, textarea, or contentEditable
   * element has focus. Default false.
   */
  allowInInputs?: boolean;
  enabled?: boolean;
};

function parseCombo(keys: string) {
  const parts = keys
    .toLowerCase()
    .split("+")
    .map((p) => p.trim());
  return {
    mod: parts.includes("mod"),
    ctrl: parts.includes("ctrl"),
    alt: parts.includes("alt") || parts.includes("opt"),
    shift: parts.includes("shift"),
    meta: parts.includes("meta") || parts.includes("cmd"),
    key: parts[parts.length - 1] ?? "",
  };
}

function eventMatchesCombo(e: KeyboardEvent, keys: string): boolean {
  const combo = parseCombo(keys);
  const key = e.key.toLowerCase();
  const mac = isMac();

  const modPressed = combo.mod ? (mac ? e.metaKey : e.ctrlKey) : true;
  const altOk = combo.alt ? e.altKey : !e.altKey;
  const shiftOk = combo.shift ? e.shiftKey : !e.shiftKey;
  const ctrlOk = combo.ctrl ? e.ctrlKey : combo.mod ? modPressed : !e.ctrlKey || mac;
  const metaOk = combo.meta ? e.metaKey : combo.mod ? modPressed : !e.metaKey || !mac;

  if (!modPressed || !altOk || !shiftOk || !ctrlOk || !metaOk) return false;

  const target = combo.key;
  if (target === "space") return key === " " || key === "space";
  if (target === "escape" || target === "esc") return key === "escape";
  if (target === "enter") return key === "enter";
  if (target === "delete" || target === "del") return key === "delete";
  if (target === "backspace") return key === "backspace";
  if (target === "tab") return key === "tab";
  if (target === "up") return key === "arrowup";
  if (target === "down") return key === "arrowdown";
  if (target === "left") return key === "arrowleft";
  if (target === "right") return key === "arrowright";
  return key === target;
}

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

export function useHotkey(spec: HotkeySpec | HotkeySpec[]): void {
  useEffect(() => {
    const specs = Array.isArray(spec) ? spec : [spec];
    const handler = (e: KeyboardEvent) => {
      const inEditable = isEditable(e.target);
      for (const s of specs) {
        if (s.enabled === false) continue;
        if (inEditable && !s.allowInInputs) continue;
        if (!eventMatchesCombo(e, s.keys)) continue;
        if (s.preventDefault !== false) e.preventDefault();
        s.handler(e);
        break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [spec]);
}
