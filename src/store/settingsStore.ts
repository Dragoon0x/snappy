import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

type SettingsState = {
  theme: Theme;
  reducedMotion: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  onboardingDone: boolean;
  setTheme: (theme: Theme) => void;
  setReducedMotion: (v: boolean) => void;
  setShowGrid: (v: boolean) => void;
  setSnapToGrid: (v: boolean) => void;
  setOnboardingDone: (v: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      reducedMotion: false,
      showGrid: false,
      snapToGrid: true,
      onboardingDone: false,
      setTheme: (theme) => set({ theme }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setShowGrid: (showGrid) => set({ showGrid }),
      setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
      setOnboardingDone: (onboardingDone) => set({ onboardingDone }),
    }),
    {
      name: "snappy.settings.v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved =
    theme === "system"
      ? window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.style.colorScheme = resolved;
}
