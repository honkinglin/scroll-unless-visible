# scroll-unless-visible

A modern, IntersectionObserver-first take on the `scroll-into-view-if-needed` API. Scrolls only when an element is not sufficiently visible, with a geometry fallback for legacy environments.

## Install

```bash
npm install scroll-unless-visible
# or
bun add scroll-unless-visible
```

## API

### `scrollIntoViewIfNeeded(target, options?)`
Works like `scroll-into-view-if-needed` but prefers `IntersectionObserver` to decide if scrolling is required.

```ts
import { scrollIntoViewIfNeeded } from "scroll-unless-visible";

const card = document.querySelector(".card")!;

await scrollIntoViewIfNeeded(card, {
  scrollMode: "if-needed", // or "always"
  block: "nearest",
  inline: "nearest",
  behavior: "smooth",
  boundary: (el) => el.classList.contains("scroll-container"), // optional
  threshold: 1,
  rootMargin: "8px",
});
```

Returns `{ visible: boolean; scrolled: boolean }`.

### `scrollUnlessVisible(target, options?)`
Alias focused on the visibility-first behavior; same return shape as above.

### `isVisible(target, options?)`
Visibility check without scrolling. Resolves to `true`/`false`.

## Options

- `scrollMode`: `"if-needed"` (default) or `"always"`
- `block`, `inline`, `behavior`, `scrollIntoViewOptions`: forwarded to `scrollIntoView`
- `boundary`: element, document, or predicate to pick a root container for visibility checks (defaults to viewport)
- `root`: explicit root for visibility (overrides `boundary`)
- `threshold`: required visible ratio (0–1), defaults to `1`
- `rootMargin`: margin around the root when testing visibility, defaults to `0px`
- `timeoutMs`: max wait for the first `IntersectionObserver` callback before falling back, defaults to `150`

## How it works

- Uses `IntersectionObserver` when available (viewport or provided root).
- Times out quickly to avoid hanging if the observer never reports.
- Falls back to a bounding-rect overlap check in older browsers.
