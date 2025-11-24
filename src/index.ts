import type {
  Boundary,
  ScrollIntoViewIfNeededOptions,
  ScrollMode,
  ScrollUnlessVisibleOptions,
  VisibilityOptions,
} from "./types";

const DEFAULT_THRESHOLD = 1;
const DEFAULT_ROOT_MARGIN = "0px";
const DEFAULT_TIMEOUT = 150;

const hasDOM = () =>
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  typeof Element !== "undefined";

const observerSupported = () => typeof IntersectionObserver !== "undefined";

const clampRatio = (value: number | undefined): number => {
  if (typeof value !== "number" || Number.isNaN(value)) return DEFAULT_THRESHOLD;
  return Math.min(1, Math.max(0, value));
};

const normalizeRoot = (root: Element | Document | null | undefined) => {
  if (root === undefined || root === null) return null;
  return root instanceof Document ? null : root;
};

const resolveRoot = (
  target: Element,
  boundary: Boundary | undefined,
  fallback: Element | Document | null | undefined
): Element | null => {
  if (boundary instanceof Element || boundary instanceof Document) {
    return normalizeRoot(boundary);
  }

  if (typeof boundary === "function") {
    let current: Element | null = target.parentElement;
    while (current) {
      if (boundary(current)) return normalizeRoot(current);
      current = current.parentElement;
    }
    return null;
  }

  return normalizeRoot(fallback);
};

const viewportRect = () => {
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  const height = window.innerHeight || document.documentElement.clientHeight || 0;
  return { top: 0, left: 0, right: width, bottom: height };
};

const parseRootMargin = (margin: string): [number, number, number, number] => {
  const tokens = margin.trim().split(/\s+/).filter(Boolean);
  const toPx = (token: string): number => {
    const match = /^(-?\d+(?:\.\d+)?)(px)?$/i.exec(token);
    return match ? Number(match[1]) : 0;
  };

  const values = tokens.map(toPx);
  const [top, right, bottom, left] = values.length
    ? values
    : [0, 0, 0, 0];
  return [
    top ?? 0,
    right ?? top ?? 0,
    bottom ?? top ?? 0,
    left ?? right ?? top ?? 0,
  ];
};

const applyMargin = (
  rect: { top: number; right: number; bottom: number; left: number },
  margin: string
) => {
  const [top, right, bottom, left] = parseRootMargin(margin);
  return {
    top: rect.top - top,
    right: rect.right + right,
    bottom: rect.bottom + bottom,
    left: rect.left - left,
  };
};

const visibleByGeometry = (
  target: Element,
  root: Element | null,
  rootMargin: string,
  threshold: number
) => {
  const rect = target.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;

  const rootRect = root ? root.getBoundingClientRect() : viewportRect();
  const expandedRoot = applyMargin(rootRect, rootMargin);

  const visibleWidth = Math.min(rect.right, expandedRoot.right) - Math.max(rect.left, expandedRoot.left);
  const visibleHeight = Math.min(rect.bottom, expandedRoot.bottom) - Math.max(rect.top, expandedRoot.top);

  if (visibleWidth <= 0 || visibleHeight <= 0) return false;

  const visibleArea = visibleWidth * visibleHeight;
  const totalArea = rect.width * rect.height;
  const ratio = visibleArea / totalArea;

  return ratio >= threshold;
};

const waitForIntersection = (
  target: Element,
  options: Required<Pick<VisibilityOptions, "root" | "rootMargin" | "threshold" | "timeoutMs">>
) =>
  new Promise<boolean>((resolve) => {
    let settled = false;
    const root = normalizeRoot(options.root);

    const finish = (visible: boolean) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      if (timer) clearTimeout(timer);
      resolve(visible);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        const visible =
          entry !== undefined &&
          entry.isIntersecting &&
          entry.intersectionRatio >= options.threshold;
        finish(visible);
      },
      {
        root,
        threshold: [options.threshold],
        rootMargin: options.rootMargin,
      }
    );

    observer.observe(target);
    const timer =
      options.timeoutMs > 0
        ? window.setTimeout(() => finish(false), options.timeoutMs)
        : null;
  });

export const isVisible = async (
  target: Element,
  opts: VisibilityOptions = {}
): Promise<boolean> => {
  if (!hasDOM()) {
    throw new Error("scroll-unless-visible requires a DOM-like environment.");
  }

  const threshold = clampRatio(opts.threshold);
  const rootMargin = opts.rootMargin ?? DEFAULT_ROOT_MARGIN;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;
  const root = normalizeRoot(opts.root);

  if (observerSupported()) {
    return waitForIntersection(target, {
      root,
      rootMargin,
      threshold,
      timeoutMs,
    });
  }

  return visibleByGeometry(target, root, rootMargin, threshold);
};

export const scrollUnlessVisible = async (
  target: Element,
  opts: ScrollUnlessVisibleOptions = {}
): Promise<{ visible: boolean; scrolled: boolean }> => {
  const visible = await isVisible(target, opts);

  if (visible) {
    return { visible: true, scrolled: false };
  }

  const scrollOptions: ScrollIntoViewOptions = {
    behavior: opts.behavior ?? "smooth",
    block: opts.block ?? "nearest",
    inline: opts.inline ?? "nearest",
    ...opts.scrollIntoViewOptions,
  };

  target.scrollIntoView(scrollOptions);
  return { visible: false, scrolled: true };
};

export const scrollIntoViewIfNeeded = async (
  target: Element,
  opts: ScrollIntoViewIfNeededOptions = {}
): Promise<{ visible: boolean; scrolled: boolean }> => {
  const root = resolveRoot(target, opts.boundary, opts.root);
  const scrollMode: ScrollMode = opts.scrollMode ?? "if-needed";

  if (scrollMode === "always") {
    target.scrollIntoView({
      behavior: opts.behavior ?? "smooth",
      block: opts.block ?? "nearest",
      inline: opts.inline ?? "nearest",
      ...opts.scrollIntoViewOptions,
    });
    return { visible: false, scrolled: true };
  }

  const visible = await isVisible(target, { ...opts, root });
  if (visible) {
    return { visible: true, scrolled: false };
  }

  target.scrollIntoView({
    behavior: opts.behavior ?? "smooth",
    block: opts.block ?? "nearest",
    inline: opts.inline ?? "nearest",
    ...opts.scrollIntoViewOptions,
  });

  return { visible: false, scrolled: true };
};

export default scrollIntoViewIfNeeded;
export * from "./types";
