import { describe, it, expect, beforeEach, vi } from "vitest";
import scrollIntoViewIfNeeded from "../src/index";

type Rect = Partial<DOMRect> & { width: number; height: number };

const createElementWithRect = (rect: Rect) => {
  const el = document.createElement("div");
  // @ts-expect-error attach test helpers
  el._rect = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    x: 0,
    y: 0,
    ...rect,
  } as DOMRect;
  el.getBoundingClientRect = () => (el as any)._rect;
  (el as any).scrollCalls = 0;
  el.scrollIntoView = vi.fn(() => {
    (el as any).scrollCalls += 1;
  });
  return el as unknown as HTMLElement & { _rect: DOMRect; scrollCalls: number };
};

beforeEach(() => {
  // Force geometry path to simplify assertions.
  // @ts-expect-error override
  globalThis.IntersectionObserver = undefined;
});

describe("scrollIntoViewIfNeeded (integration)", () => {
  it("does not scroll when already visible in boundary", async () => {
    const container = createElementWithRect({ top: 0, left: 0, right: 120, bottom: 120, width: 120, height: 120 });
    const target = createElementWithRect({ top: 10, left: 10, right: 60, bottom: 60, width: 50, height: 50 });

    const result = await scrollIntoViewIfNeeded(target, { boundary: container, behavior: "auto" });
    expect(result).toEqual({ visible: true, scrolled: false });
    expect(target.scrollCalls).toBe(0);
  });

  it("scrolls when target is below the fold", async () => {
    const container = createElementWithRect({ top: 0, left: 0, right: 120, bottom: 120, width: 120, height: 120 });
    const target = createElementWithRect({ top: 200, left: 0, right: 250, bottom: 250, width: 50, height: 50 });

    const result = await scrollIntoViewIfNeeded(target, { boundary: container, behavior: "auto" });
    expect(result.visible).toBe(false);
    expect(result.scrolled).toBe(true);
    expect(target.scrollCalls).toBe(1);
  });

  it("forces scroll when scrollMode is 'always' even if visible", async () => {
    const container = createElementWithRect({ top: 0, left: 0, right: 150, bottom: 150, width: 150, height: 150 });
    const target = createElementWithRect({ top: 20, left: 20, right: 70, bottom: 70, width: 50, height: 50 });

    const result = await scrollIntoViewIfNeeded(target, {
      boundary: container,
      scrollMode: "always",
      behavior: "auto",
    });
    expect(result.scrolled).toBe(true);
    expect(target.scrollCalls).toBe(1);
  });

  it("scrolls horizontally into view", async () => {
    const container = createElementWithRect({ top: 0, left: 0, right: 150, bottom: 100, width: 150, height: 100 });
    const target = createElementWithRect({ top: 0, left: 300, right: 350, bottom: 50, width: 50, height: 50 });

    const result = await scrollIntoViewIfNeeded(target, { boundary: container, behavior: "auto" });
    expect(result.scrolled).toBe(true);
    expect(target.scrollCalls).toBe(1);
  });
});
