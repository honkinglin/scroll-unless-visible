# scroll-unless-visible

IntersectionObserver-first drop-in for `scroll-into-view-if-needed`. It scrolls only when an element isn’t sufficiently visible, with a geometry fallback for legacy environments.

## Features
- Observer-backed visibility (no manual math when supported)
- `scrollMode: "if-needed" | "always"` to mirror the original API
- Works with viewport or container roots (`boundary` / `root`), margins, and thresholds
- Smooth scroll defaults plus a timeout-backed fallback when observers are missing

## Install

```bash
npm install scroll-unless-visible
# or
bun add scroll-unless-visible
```

## Usage

```ts
import { scrollIntoViewIfNeeded } from "scroll-unless-visible";

const card = document.querySelector(".card")!;

const result = await scrollIntoViewIfNeeded(card, {
  scrollMode: "if-needed", // or "always"
  behavior: "smooth",
  block: "nearest",
  inline: "nearest",
  boundary: (el) => el.classList.contains("scroll-container"),
  threshold: 1,
  rootMargin: "8px",
});
// result => { visible: boolean; scrolled: boolean }
```

Other exports:
- `scrollUnlessVisible(target, options?)`
- `isVisible(target, options?)`

## Options

- `scrollMode`: `"if-needed"` (default) | `"always"`
- `block`, `inline`, `behavior`, `scrollIntoViewOptions`: forwarded to `scrollIntoView`
- `boundary`: element, document, or predicate to choose the scroll container; defaults to viewport
- `root`: explicit root for visibility (overrides `boundary`)
- `threshold`: required visible ratio (0–1), default `1`
- `rootMargin`: margin around the root for visibility checks, default `0px`
- `timeoutMs`: max wait for the first observer callback before falling back, default `150`

## Behavior notes

- Prefers `IntersectionObserver` with the provided root; falls back to geometry when unavailable or timed out.
- Uses smooth scrolling and `"nearest"` positioning by default to minimize layout jumps.

## Testing

- Unit: `npm run test:unit` (Vitest, jsdom)
- E2E-style: `npm run test:e2e` (Vitest, jsdom)
- Full suite: `npm test`
