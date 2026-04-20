import { useEffect, useState } from "react";

type ToastEntry = {
  id: number;
  message: string;
  tone: "ok" | "error";
};

type Listener = (toasts: ToastEntry[]) => void;

let nextId = 1;
let live: ToastEntry[] = [];
const listeners = new Set<Listener>();

function emit(): void {
  for (const l of listeners) l(live);
}

export function showToast(message: string, tone: "ok" | "error" = "ok", ms = 2400): void {
  const entry: ToastEntry = { id: nextId++, message, tone };
  live = [...live, entry];
  emit();
  setTimeout(() => {
    live = live.filter((t) => t.id !== entry.id);
    emit();
  }, ms);
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastEntry[]>(live);

  useEffect(() => {
    const l: Listener = (next) => setToasts([...next]);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            t.tone === "error"
              ? "surface rounded-full px-4 py-2 text-sm shadow-xl border border-red-500/60 text-red-300 animate-slide-up"
              : "surface rounded-full px-4 py-2 text-sm shadow-xl border border-border text-fg/90 animate-slide-up"
          }
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
