import { saveDocument } from "@/lib/db/dexie";
import { debounce } from "@/lib/utils";
import { useDocumentStore } from "@/store/documentStore";
import { useEffect, useRef } from "react";

export function useAutosave(debounceMs = 750): void {
  const doc = useDocumentStore((s) => s.doc);
  const debouncedRef = useRef<((d: typeof doc) => void) | null>(null);

  useEffect(() => {
    debouncedRef.current = debounce((d: typeof doc) => {
      const run = () => {
        saveDocument(d).catch((err) => {
          console.warn("Autosave failed:", err);
        });
        try {
          localStorage.setItem("snappy.lastDocumentId", d.id);
        } catch {
          // ignore
        }
      };
      if ("requestIdleCallback" in window) {
        (
          window as unknown as {
            requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void;
          }
        ).requestIdleCallback(run, { timeout: 2000 });
      } else {
        run();
      }
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    debouncedRef.current?.(doc);
  }, [doc]);
}
