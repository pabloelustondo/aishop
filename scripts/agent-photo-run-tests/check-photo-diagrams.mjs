// Offline rendering check. Arguments: Playwright entry and VS Code sidebar Mermaid bundle.
// No package installation, remote renderer, credentials or application requests.
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const [playwrightEntry, mermaidBundle] = process.argv.slice(2);
assert.ok(playwrightEntry && mermaidBundle, "Provide local Playwright and Mermaid bundle paths.");
const playwright = await import(pathToFileURL(playwrightEntry));
const { chromium } = playwright.default ?? playwright;
const document = readFileSync(new URL(
  "../../01-docs/guides/vision-agent-photo-analysis/photo-sequence.md", import.meta.url), "utf8");
const diagrams = [...document.matchAll(/```mermaid\n([\s\S]*?)```/g)].map(match => match[1]);
assert.equal(diagrams.length, 3, "Expected start, request assembly and collection views.");
const output = mkdtempSync(join(tmpdir(), "aishop-photo-diagrams-"));
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1200 } });
  await page.route("**/*", route => route.abort());
  await page.setContent('<body style="margin:24px;background:white"><main></main></body>');
  await page.addScriptTag({ path: mermaidBundle });
  for (const [index, diagram] of diagrams.entries()) {
    const result = await page.evaluate(async ({ diagram, index }) => {
      const svg = await window.sidebarMermaid.render(diagram, `photoDiagram${index}`);
      if (!svg) throw new Error(`Diagram ${index + 1} could not be rendered.`);
      document.querySelector("main").innerHTML = svg;
      const bounds = document.querySelector("main svg").getBoundingClientRect();
      return { width: bounds.width, height: bounds.height };
    }, { diagram, index });
    assert.ok(result.width > 0 && result.height > 0);
    await page.locator("main").screenshot({ path: join(output, `diagram-${index + 1}.png`) });
    console.log(`PASS diagram ${index + 1}: ${Math.round(result.width)} x ${Math.round(result.height)}`);
  }
  console.log(`Rendered diagrams: ${output}`);
} finally {
  await browser.close();
}
