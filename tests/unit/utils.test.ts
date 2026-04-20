import { clamp, debounce, formatBytes, lerp, rafThrottle } from "@/lib/utils";
import { describe, expect, it, vi } from "vitest";

describe("clamp", () => {
  it("clamps below the min", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });
  it("clamps above the max", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
  it("is identity within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe("lerp", () => {
  it("returns a when t=0", () => {
    expect(lerp(2, 8, 0)).toBe(2);
  });
  it("returns b when t=1", () => {
    expect(lerp(2, 8, 1)).toBe(8);
  });
  it("interpolates at t=0.5", () => {
    expect(lerp(2, 8, 0.5)).toBe(5);
  });
});

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
  });
  it("formats kilobytes", () => {
    expect(formatBytes(2048)).toBe("2.0 KB");
  });
  it("formats megabytes", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});

describe("debounce", () => {
  it("fires only after the idle window", async () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = debounce((n: number) => spy(n), 50);
    debounced(1);
    debounced(2);
    debounced(3);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(49);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledExactlyOnceWith(3);
    vi.useRealTimers();
  });
});

describe("rafThrottle", () => {
  it("coalesces rapid calls into one per frame, using the last args", () => {
    const spy = vi.fn();
    const origRAF = globalThis.requestAnimationFrame;
    let pending: FrameRequestCallback | null = null;
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      pending = cb;
      return 1;
    }) as typeof globalThis.requestAnimationFrame;

    const throttled = rafThrottle((n: number) => spy(n));
    throttled(1);
    throttled(2);
    throttled(3);
    expect(spy).not.toHaveBeenCalled();

    // flush the frame
    pending?.(0);
    expect(spy).toHaveBeenCalledExactlyOnceWith(3);

    globalThis.requestAnimationFrame = origRAF;
  });
});
