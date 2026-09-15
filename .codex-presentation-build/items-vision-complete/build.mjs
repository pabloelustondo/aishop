import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = "/Users/paboelustodo/-PROJECTS/aishop";
const skillDir = "/Users/paboelustodo/.codex/plugins/cache/openai-primary-runtime/presentations/26.904.11930/skills/presentations";
const buildDir = path.join(workspaceDir, ".codex-presentation-build/items-vision-complete");
const finalPath = path.join(workspaceDir, "output/presentation/VISTA-Agentic-Items-Vision-Complete-Draft-v3.pptx");
const runtimePython = "/Users/paboelustodo/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const { resolvePresentationFont, finalizePresentation } = await import(
  pathToFileURL(path.join(skillDir, "container_tools/artifact_tool_utils.mjs")).href,
);
const family = resolvePresentationFont({ fontFamily: "Arial" });

const concepts = [
  ["000-title", "000", "docs/guides/items-vision/000-title/000-visual.png"],
  ["00-business-context", "00", "docs/guides/items-vision/00-business-context/00-visual.png"],
  ["005-sdlc2-framework", "005", ".codex-presentation-build/items-vision-complete/rendered/005-sdlc2-framework-005-visual.png"],
  ["01-intent", "01", "docs/guides/items-vision/01-intent/01-visual.png"],
  ["02-user-journey", "02", ".codex-presentation-build/items-vision-complete/rendered/02-user-journey-02-visual.png"],
  ["03-benchmark-purpose", "03", ".codex-presentation-build/items-vision-complete/rendered/03-benchmark-purpose-03-visual.png"],
  ["031-vision-quality-benchmark", "031", ".codex-presentation-build/items-vision-complete/rendered/031-vision-quality-benchmark-031-visual.png"],
  ["032-test-strategy", "032", ".codex-presentation-build/items-vision-complete/rendered/032-test-strategy-032-visual.png"],
];

const C = { bg: "#F7F5EF", navy: "#172D43", teal: "#087E8B", gold: "#D5A11E", ink: "#263746", muted: "#61717E", white: "#FFFFFF", pale: "#EAF2F1" };
const presentation = Presentation.create({ slideSize: { width: 1600, height: 900 } });

function box(slide, x, y, w, h, fill = "none", radius = "rect") {
  return slide.shapes.add({ geometry: radius, position: { left: x, top: y, width: w, height: h }, fill, line: { fill: "none", width: 0 } });
}

function textBox(slide, text, x, y, w, h, size, color = C.ink, bold = false, align = "left") {
  const s = box(slide, x, y, w, h);
  s.text = text;
  s.text.style = { typeface: family, fontSize: size, color, bold, autoFit: "shrinkText", verticalAlignment: "middle", textAlign: align };
  return s;
}

function parseMarkdown(md) {
  const lines = md.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const title = (lines.find(l => l.startsWith("# ")) || "# Untitled").slice(2);
  const blocks = [];
  let current = { heading: "", items: [] };
  for (const line of lines) {
    if (line.startsWith("# ")) continue;
    if (line.startsWith("## ")) {
      if (current.heading || current.items.length) blocks.push(current);
      current = { heading: line.slice(3), items: [] };
    } else {
      current.items.push(line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, m => m));
    }
  }
  if (current.heading || current.items.length) blocks.push(current);
  return { title, blocks };
}

function addHeader(slide, title, code) {
  box(slide, 0, 0, 1600, 900, C.bg);
  box(slide, 0, 0, 28, 900, C.teal);
  textBox(slide, code, 75, 46, 130, 40, 18, C.teal, true);
  textBox(slide, title, 75, 88, 1410, 90, 43, C.navy, true);
  box(slide, 75, 190, 1450, 3, C.gold);
}

function addTitleTextSlide(slide, title, blocks, code) {
  box(slide, 0, 0, 1600, 900, C.navy);
  box(slide, 0, 0, 30, 900, C.teal);
  textBox(slide, "AI SHOP · VISTA · SDLC2", 110, 100, 900, 42, 20, "#8FD0C8", true);
  textBox(slide, title, 110, 235, 1300, 140, 60, C.white, true);
  const subtitle = blocks.flatMap(b => [b.heading, ...b.items]).filter(Boolean).join("\n");
  textBox(slide, subtitle, 115, 410, 1050, 180, 30, "#D9E5E8", false);
  box(slide, 110, 670, 900, 5, C.gold);
  textBox(slide, "A real application evaluated through a complete software lifecycle", 110, 710, 1200, 70, 24, "#BBD1D4");
  textBox(slide, code, 1400, 790, 100, 40, 18, "#8FD0C8", true, "right");
}

function addBodyTextSlide(slide, title, blocks, code) {
  addHeader(slide, title, code);
  let contentBlocks = blocks;
  let top = 230;
  if (blocks.length > 1 && !blocks[0].heading) {
    const intro = blocks[0].items.join(" ");
    box(slide, 75, 222, 1450, 68, C.pale, "roundRect");
    textBox(slide, intro, 105, 232, 1390, 48, 22, C.navy, true);
    contentBlocks = blocks.slice(1);
    top = 315;
  }
  const totalLines = contentBlocks.reduce((n, b) => n + b.items.length + (b.heading ? 1 : 0), 0);
  const columns = contentBlocks.length >= 2 ? Math.min(contentBlocks.length, 4) : 1;
  const gap = 24;
  const left = 75;
  const areaW = 1450;
  const colW = (areaW - gap * (columns - 1)) / columns;
  const grouped = Array.from({ length: columns }, () => []);
  contentBlocks.forEach((b, i) => grouped[i % columns].push(b));
  const bodySize = columns === 1 ? 24 : columns === 2 ? 22 : totalLines > 15 ? 18 : 20;
  grouped.forEach((group, col) => {
    let y = top;
    for (const block of group) {
      const itemCount = Math.max(block.items.length, 1);
      const cardH = columns === 1 ? 640 : columns === 2 ? 500 : 455;
      box(slide, left + col * (colW + gap), y, colW, cardH, C.white, "roundRect");
      if (block.heading) {
        textBox(slide, block.heading, left + col * (colW + gap) + 28, y + 20, colW - 56, 42, 23, C.teal, true);
        y += 60;
      } else y += 24;
      for (const item of block.items) {
        const numbered = /^\d+\./.test(item);
        box(slide, left + col * (colW + gap) + 30, y + 13, 11, 11, numbered ? C.gold : C.teal, numbered ? "rect" : "ellipse");
        textBox(slide, item, left + col * (colW + gap) + 55, y, colW - 85, bodySize + 34, bodySize, C.ink, numbered);
        y += columns === 1 ? 64 : columns === 2 ? 76 : 68;
      }
      y = top + cardH + 20;
    }
  });
  textBox(slide, "EDITABLE TEXT", 1300, 830, 220, 28, 14, C.muted, true, "right");
}

for (const [folder, code, visualRel] of concepts) {
  const base = path.join(workspaceDir, "docs/guides/items-vision", folder);
  const md = await fs.readFile(path.join(base, `${code}-slide.md`), "utf8");
  const notes = await fs.readFile(path.join(base, `${code}-notes.md`), "utf8");
  const parsed = parseMarkdown(md);

  const textSlide = presentation.slides.add();
  if (code === "000") addTitleTextSlide(textSlide, parsed.title, parsed.blocks, code);
  else addBodyTextSlide(textSlide, parsed.title, parsed.blocks, code);
  textSlide.speakerNotes.textFrame.setText(notes);
  textSlide.speakerNotes.setVisible(true);

  const visualSlide = presentation.slides.add();
  visualSlide.background.fill = C.bg;
  const bytes = new Uint8Array(await fs.readFile(path.join(workspaceDir, visualRel)));
  visualSlide.images.add({ blob: bytes, contentType: "image/png", alt: `${parsed.title} visual`, fit: "contain", position: { left: 0, top: 0, width: 1600, height: 900 } });
  visualSlide.speakerNotes.textFrame.setText(`Visual companion for ${parsed.title}.\n\nContinue the explanation from the preceding editable text slide. This slide is the rendered visual artifact from ${folder}/${code}-visual. The source narrative and detailed presenter guidance remain in the preceding slide notes.`);
  visualSlide.speakerNotes.setVisible(true);
}

await fs.mkdir(buildDir, { recursive: true });
await fs.mkdir(path.dirname(finalPath), { recursive: true });
const candidatePath = path.join(buildDir, "candidate-v3.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

const result = await finalizePresentation({
  explicitTotalSlideCount: 16,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  workspaceDir,
  candidatePath,
  finalPath,
  pythonExecutable: runtimePython,
  integrityValidatorPath: path.join(skillDir, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(skillDir, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "15240000,8572500", "--validate-bullet-geometry", "--validate-heading-fit"],
  requiredNativeTableOwnerSlides: [],
  fontPolicy: { basis: "design", families: [family] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(buildDir, "VISTA-Agentic-Items-Vision-Complete-Draft-v3.validation.json"),
});
console.log(JSON.stringify({ finalPath, family, result }, null, 2));
