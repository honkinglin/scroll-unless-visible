import { describe, expect, it, beforeEach, afterEach, beforeAll, afterAll } from "bun:test";
import scrollIntoViewIfNeeded, {
  isVisible,
  scrollUnlessVisible,
} from "../src/index";

class MockElement {
  className: string = "";
  classList = {
    contains: (name: string) => this._classes.includes(name),
  };
  parentElement: MockElement | null = null;
  scrollCalls = 0;
  scrollIntoView = () => {
    this.scrollCalls += 1;
  };
  _rect: DOMRect = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON() {
      return this;
    },
  } as DOMRect;
  _classes: string[] = [];
  getBoundingClientRect = () => this._rect;
}

class MockDocument {
  createElement() {
    return new MockElement();
  }
  documentElement = {
    clientWidth: 0,
    clientHeight: 0,
  };
}

const originalGlobals = {
  IntersectionObserver: globalThis.IntersectionObserver,
  innerWidth: globalThis.innerWidth,
  innerHeight: globalThis.innerHeight,
  document: globalThis.document,
  window: globalThis.window,
  Element: globalThis.Element,
  Document: globalThis.Document,
};

const installDOM = () => {
  // Minimal window/document/Element shim for geometry path tests.
  const mockDocument = new MockDocument();
  globalThis.window = globalThis as any;
  globalThis.document = mockDocument as any;
  globalThis.Element = MockElement as any;
  globalThis.Document = MockDocument as any;
};

const resetGlobals = () => {
  globalThis.IntersectionObserver = originalGlobals.IntersectionObserver as any;
  (globalThis as any).innerWidth = originalGlobals.innerWidth;
  (globalThis as any).innerHeight = originalGlobals.innerHeight;
  globalThis.document = originalGlobals.document as any;
  globalThis.window = originalGlobals.window as any;
  globalThis.Element = originalGlobals.Element as any;
  globalThis.Document = originalGlobals.Document as any;
};

beforeAll(() => {
  installDOM();
});

beforeEach(() => {
  resetGlobals();
  installDOM();
});

afterEach(() => {
  resetGlobals();
});

afterAll(() => {
  resetGlobals();
});

describe("isVisible (geometry fallback)", () => {
  it("returns true when fully inside the viewport", async () => {
    // Force the geometry path by disabling IntersectionObserver.
    // @ts-expect-error - intentional override for test
    globalThis.IntersectionObserver = undefined;
    (globalThis as any).innerWidth = 200;
    (globalThis as any).innerHeight = 200;

    const el = document.createElement("div") as unknown as MockElement;
    el._rect = { top: 10, left: 10, right: 60, bottom: 60, width: 50, height: 50 } as DOMRect;

    const visible = await isVisible(el as unknown as Element);
    expect(visible).toBeTrue();
  });

  it("returns false when outside the viewport", async () => {
    // @ts-expect-error - intentional override for test
    globalThis.IntersectionObserver = undefined;
    (globalThis as any).innerWidth = 100;
    (globalThis as any).innerHeight = 100;

    const el = document.createElement("div") as unknown as MockElement;
    el._rect = { top: 150, left: 150, right: 200, bottom: 200, width: 50, height: 50 } as DOMRect;

    const visible = await isVisible(el as unknown as Element);
    expect(visible).toBeFalse();
  });

  it("respects root and rootMargin", async () => {
    // @ts-expect-error - intentional override for test
    globalThis.IntersectionObserver = undefined;

    const root = document.createElement("div") as unknown as MockElement;
    root._rect = { top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100 } as DOMRect;

    const el = document.createElement("div") as unknown as MockElement;
    el._rect = { top: 95, left: 95, right: 145, bottom: 145, width: 50, height: 50 } as DOMRect;

    const visible = await isVisible(el as unknown as Element, { root: root as unknown as Element, rootMargin: "20px", threshold: 0.2 });
    expect(visible).toBeTrue();
  });
});

describe("scrollIntoViewIfNeeded", () => {
  it("does not scroll when already visible", async () => {
    // @ts-expect-error - intentional override for test
    globalThis.IntersectionObserver = undefined;
    (globalThis as any).innerWidth = 200;
    (globalThis as any).innerHeight = 200;

    const el = document.createElement("div") as unknown as MockElement;
    el._rect = { top: 10, left: 10, right: 60, bottom: 60, width: 50, height: 50 } as DOMRect;

    const result = await scrollIntoViewIfNeeded(el as unknown as Element);
    expect(result).toEqual({ visible: true, scrolled: false });
    expect(el.scrollCalls).toBe(0);
  });

  it("scrolls when not visible", async () => {
    // @ts-expect-error - intentional override for test
    globalThis.IntersectionObserver = undefined;
    (globalThis as any).innerWidth = 100;
    (globalThis as any).innerHeight = 100;

    const el = document.createElement("div") as unknown as MockElement;
    el._rect = { top: 150, left: 150, right: 200, bottom: 200, width: 50, height: 50 } as DOMRect;

    const result = await scrollIntoViewIfNeeded(el as unknown as Element);
    expect(result.scrolled).toBeTrue();
    expect(el.scrollCalls).toBe(1);
  });

  it("forces scroll when scrollMode is 'always'", async () => {
    const el = document.createElement("div") as unknown as MockElement;
    el._rect = { top: 10, left: 10, right: 60, bottom: 60, width: 50, height: 50 } as DOMRect;

    const result = await scrollIntoViewIfNeeded(el as unknown as Element, { scrollMode: "always" });
    expect(result.scrolled).toBeTrue();
    expect(el.scrollCalls).toBe(1);
  });

  it("uses boundary predicate to resolve root", async () => {
    // @ts-expect-error - intentional override for test
    globalThis.IntersectionObserver = undefined;

    const container = document.createElement("div") as unknown as MockElement;
    container.className = "scroll-container";
    container._classes = ["scroll-container"];
    container._rect = { top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100 } as DOMRect;

    const el = document.createElement("div") as unknown as MockElement;
    el._rect = { top: 150, left: 150, right: 200, bottom: 200, width: 50, height: 50 } as DOMRect;
    el.parentElement = container;

    const result = await scrollIntoViewIfNeeded(el as unknown as Element, {
      boundary: (node) => (node as unknown as MockElement).classList.contains("scroll-container"),
    });
    expect(result.scrolled).toBeTrue();
    expect(el.scrollCalls).toBe(1);
  });
});

describe("scrollUnlessVisible", () => {
  it("wraps isVisible + scroll behavior", async () => {
    // @ts-expect-error - intentional override for test
    globalThis.IntersectionObserver = undefined;
    (globalThis as any).innerWidth = 100;
    (globalThis as any).innerHeight = 100;

    const el = document.createElement("div") as unknown as MockElement;
    el._rect = { top: 150, left: 150, right: 200, bottom: 200, width: 50, height: 50 } as DOMRect;

    const result = await scrollUnlessVisible(el as unknown as Element);
    expect(result.scrolled).toBeTrue();
    expect(el.scrollCalls).toBe(1);
  });
});
