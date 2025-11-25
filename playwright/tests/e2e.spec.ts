import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

declare global {
  interface Window {
    scrollIntoViewIfNeeded: (...args: any[]) => Promise<any>;
  }
}

test.describe("scrollIntoViewIfNeeded (browser)", () => {
  test.beforeEach(async ({ page }) => {
    const bundlePath = path.join(__dirname, "..", "..", "dist", "index.js");
    const bundleUrl = `file://${bundlePath}`;

    await page.addInitScript({
      type: "module",
      content: `
        import scrollIntoViewIfNeeded from "${bundleUrl}";
        window.scrollIntoViewIfNeeded = scrollIntoViewIfNeeded;
      `,
    });
  });

  test("does not scroll when already visible", async ({ page }) => {
    await page.setContent(`
      <style>
        #container { height: 120px; width: 120px; overflow: auto; border: 1px solid #ccc; }
        #spacer { height: 10px; }
        #target { height: 40px; }
        #bottom { height: 300px; }
      </style>
      <div id="container">
        <div id="spacer"></div>
        <button id="target">target</button>
        <div id="bottom"></div>
      </div>
    `);

    const result = await page.evaluate(async () => {
      const container = document.getElementById("container")!;
      const target = document.getElementById("target")!;
      const before = container.scrollTop;
      const res = await window.scrollIntoViewIfNeeded(target, { boundary: container });
      return { res, before, after: container.scrollTop };
    });

    expect(result.res).toEqual({ visible: true, scrolled: false });
    expect(result.after).toBe(result.before);
  });

  test("scrolls when target is below the fold", async ({ page }) => {
    await page.setContent(`
      <style>
        #container { height: 120px; width: 120px; overflow: auto; border: 1px solid #ccc; }
        .block { height: 80px; }
        #target { height: 40px; }
      </style>
      <div id="container">
        <div class="block"></div>
        <div class="block"></div>
        <button id="target">target</button>
        <div class="block"></div>
      </div>
    `);

    const result = await page.evaluate(async () => {
      const container = document.getElementById("container")!;
      const target = document.getElementById("target")!;
      const before = container.scrollTop;
      const res = await window.scrollIntoViewIfNeeded(target, { boundary: container });
      return { res, before, after: container.scrollTop };
    });

    expect(result.res.visible).toBe(false);
    expect(result.res.scrolled).toBe(true);
    expect(result.after).toBeGreaterThan(result.before);
  });

  test("scrollMode 'always' forces a scroll even when visible", async ({ page }) => {
    await page.setContent(`
      <style>
        #container { height: 120px; width: 120px; overflow: auto; border: 1px solid #ccc; }
        #top { height: 20px; }
        #target { height: 40px; }
        #bottom { height: 400px; }
      </style>
      <div id="container">
        <div id="top"></div>
        <button id="target">target</button>
        <div id="bottom"></div>
      </div>
    `);

    const result = await page.evaluate(async () => {
      const container = document.getElementById("container")!;
      const target = document.getElementById("target")!;
      const before = container.scrollTop;
      const res = await window.scrollIntoViewIfNeeded(target, {
        boundary: container,
        scrollMode: "always",
        behavior: "auto",
      });
      return { res, before, after: container.scrollTop };
    });

    expect(result.res.scrolled).toBe(true);
    expect(result.after).toBeGreaterThan(result.before);
  });

  test("scrolls horizontally into view", async ({ page }) => {
    await page.setContent(`
      <style>
        #container { height: 100px; width: 150px; overflow: auto; border: 1px solid #ccc; white-space: nowrap; }
        .spacer { display: inline-block; width: 300px; height: 50px; }
        #target { display: inline-block; width: 50px; height: 50px; }
      </style>
      <div id="container">
        <div class="spacer"></div>
        <button id="target">target</button>
      </div>
    `);

    const result = await page.evaluate(async () => {
      const container = document.getElementById("container")!;
      const target = document.getElementById("target")!;
      const before = container.scrollLeft;
      const res = await window.scrollIntoViewIfNeeded(target, {
        boundary: container,
        behavior: "auto",
      });
      return { res, before, after: container.scrollLeft };
    });

    expect(result.res.scrolled).toBe(true);
    expect(result.after).toBeGreaterThan(result.before);
  });
});
