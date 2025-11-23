export type ScrollMode = "always" | "if-needed";

export type Boundary =
  | Element
  | Document
  | ((ancestor: Element) => boolean);

export type VisibilityOptions = {
  /**
   * Scroll container. If omitted, the viewport is used.
   */
  root?: Element | Document | null;
  /**
   * How much of the element must be visible (0–1). Defaults to 1 (fully visible).
   */
  threshold?: number;
  /**
   * Extra margin around the root when testing visibility. CSS-like string; only px is honored in the fallback path.
   */
  rootMargin?: string;
  /**
   * Maximum time to wait for the first IntersectionObserver callback before falling back. Defaults to 150ms.
   */
  timeoutMs?: number;
};

export type ScrollUnlessVisibleOptions = VisibilityOptions & {
  /**
   * Scroll behavior when we need to move the element. Defaults to smooth / nearest.
   */
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
  /**
   * Additional scrollIntoView options to merge on top of behavior/block/inline.
   */
  scrollIntoViewOptions?: ScrollIntoViewOptions;
};

export type ScrollIntoViewIfNeededOptions = ScrollUnlessVisibleOptions & {
  /**
   * Scroll even if already visible. Defaults to "if-needed".
   */
  scrollMode?: ScrollMode;
  /**
   * Limit visibility checks to a specific ancestor (or predicate). Defaults to viewport.
   */
  boundary?: Boundary;
};
