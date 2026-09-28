import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(scriptDir, "../../../..");
const runtimeRoot = process.env.CODEX_RUNTIME_ROOT ?? path.join(
  os.homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies",
);
const SKILL_DIR = process.env.CODEX_PRESENTATION_SKILL_DIR ?? path.join(
  os.homedir(), ".codex/plugins/cache/openai-primary-runtime/presentations/26.904.11930/skills/presentations",
);
const runtimeModules = path.join(runtimeRoot, "node/node_modules");
process.env.RUNTIME_NODE_MODULES ??= runtimeModules;
process.env.RUNTIME_BIN_DIR ??= path.join(runtimeRoot, "bin/override");
const { Presentation, PresentationFile } = await import(pathToFileURL(
  path.join(runtimeModules, "@oai/artifact-tool/dist/artifact_tool.mjs"),
).href);
const buildDir = path.join(workspaceDir, ".codex-build", "web-ui-presentation");
const finalPath = path.join(workspaceDir, "01-docs/08-low-level-design/082-web-ui/Vision-Agent-Web-UI-Low-Level-Design.pptx");
const runtimePython = path.join(runtimeRoot, "python/bin/python3");
const { resolvePresentationFont, finalizePresentation } = await import(
  pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href,
);

await fs.mkdir(buildDir, { recursive: true });
const font = resolvePresentationFont();
const deck = Presentation.create({ slideSize: { width: 1280, height: 720 } });

const C = {
  cream: "#F4F1E8", paper: "#FBFAF6", ink: "#13211B", muted: "#5E6A65",
  green: "#167552", teal: "#3E8C7A", mint: "#D9EEE6", gold: "#A56C0A",
  line: "#B8C7C0", pale: "#EAF3EF", dark: "#0E2720", white: "#FFFFFF",
};

function box(slide, x, y, w, h, fill = C.paper, stroke = C.line, radius = 14) {
  return slide.shapes.add({
    geometry: "rect", position: { left: x, top: y, width: w, height: h },
    fill, line: { fill: stroke, width: 1.5 }, borderRadius: radius,
  });
}

function text(slide, value, x, y, w, h, size = 24, color = C.ink, bold = false, align = "left") {
  const shape = slide.shapes.add({
    geometry: "textbox", position: { left: x, top: y, width: w, height: h },
    fill: "none", line: { fill: "none", width: 0 },
  });
  shape.text = value;
  shape.text.style = { typeface: font, fontSize: size, color, bold, alignment: align, autoFit: "shrinkText" };
  return shape;
}

function base(slide, title, number) {
  slide.background.fill = C.cream;
  text(slide, title, 64, 42, 1040, 58, 34, C.ink, true);
  slide.shapes.add({ geometry: "line", position: { left: 64, top: 112, width: 1152, height: 0 }, fill: "none", line: { fill: C.line, width: 1.5 } });
  text(slide, String(number).padStart(2, "0"), 1160, 48, 56, 34, 16, C.green, true, "right");
}

function connect(slide, a, b, opts = {}) {
  // The library places the arrowhead at its first shape. Reverse its arguments
  // so this helper retains the conventional source-to-target call order.
  return slide.shapes.connect(b, a, {
    kind: opts.kind ?? "elbow", fromSide: opts.toSide ?? "left", toSide: opts.fromSide ?? "right",
    line: { style: opts.dashed ? "dash" : "solid", fill: opts.color ?? C.teal, width: opts.width ?? 2.5 },
    head: { type: "arrow", width: "med", length: "med" },
  });
}

function labelBox(slide, label, sub, x, y, w, h, fill = C.paper, stroke = C.line) {
  const s = box(slide, x, y, w, h, fill, stroke, 16);
  text(slide, label, x + 18, y + 16, w - 36, 30, 20, C.ink, true, "center");
  if (sub) text(slide, sub, x + 16, y + 50, w - 32, h - 58, 14, C.muted, false, "center");
  return s;
}

function notes(slide, body) {
  slide.speakerNotes.textFrame.setText(body);
}

// 00 Cover
{
  const s = deck.slides.add();
  s.background.fill = C.dark;
  text(s, "AI SHOP · LOW-LEVEL DESIGN", 72, 72, 560, 34, 17, "#9FD4C3", true);
  text(s, "Vision Agent\nWeb UI", 72, 138, 550, 160, 54, C.white, true);
  text(s, "From hosted page to authenticated analysis workflow", 74, 326, 500, 72, 24, "#D7E5DF");
  const screenshot = await fs.readFile(path.join(
    scriptDir, "../00-title/assets/agent-page.png",
  ));
  box(s, 650, 82, 560, 550, "#173D33", "#76AA99", 24);
  s.images.add({
    blob: screenshot,
    contentType: "image/png",
    alt: "Hosted AI Shop Agent page showing a shelf photograph and analysis results",
    fit: "cover",
    position: { left: 662, top: 94, width: 536, height: 526 },
    geometry: "roundRect",
    borderRadius: 18,
  });
  text(s, "Hosted Agent page · agent.html", 700, 644, 460, 24, 15, "#9FD4C3", true, "center");
  notes(s, "This presentation explains the static browser client published from 02-web-ui/. The browser selects evidence, transfers files, requests work, observes durable status, and renders results. Authorization, storage verification, background processing, and OpenAI calls remain server-side. Code entry point: 02-web-ui/agent.html. Client controller: 02-web-ui/scripts/agent.js.");
}

// 01 Boundary
{
  const s = deck.slides.add(); base(s, "Browser and server boundary", 1);
  text(s, "PUBLIC BROWSER", 74, 142, 240, 24, 15, C.muted, true);
  text(s, "FIREBASE HOSTING", 501, 142, 250, 24, 15, C.muted, true);
  text(s, "SERVER PLATFORM", 916, 142, 250, 24, 15, C.muted, true);
  const browser = labelBox(s, "Static web client", "HTML · CSS · JavaScript\nFirebase Auth session", 72, 190, 280, 160, C.paper, C.teal);
  const hosting = labelBox(s, "Hosting", "02-web-ui/ assets\n/v1/... rewrites", 500, 190, 250, 160, C.pale, C.green);
  const api = labelBox(s, "Agent API", "identity · roles · records", 900, 190, 280, 112, C.paper, C.green);
  const durable = labelBox(s, "Durable services", "Storage · Firestore · Tasks", 900, 350, 280, 112, C.paper, C.line);
  const openai = labelBox(s, "OpenAI", "external recognition model", 900, 520, 280, 96, "#EDF0F5", "#8290A5");
  connect(s, browser, hosting);
  connect(s, hosting, api);
  connect(s, api, durable, { fromSide: "bottom", toSide: "top" });
  connect(s, api, openai, { fromSide: "right", toSide: "right", color: "#8290A5" });
  const direct = labelBox(s, "Video bytes", "temporary Storage session URI", 430, 486, 300, 88, C.paper, C.gold);
  connect(s, browser, direct, { fromSide: "bottom", toSide: "left", dashed: true, color: C.gold });
  connect(s, direct, durable, { fromSide: "right", toSide: "left", dashed: true, color: C.gold });
  text(s, "Solid: authenticated application requests", 72, 642, 420, 24, 14, C.muted);
  text(s, "Dashed: direct resumable video transfer", 742, 642, 438, 24, 14, C.gold, false, "right");
  notes(s, "firebase.json publishes 02-web-ui/ as the Hosting root. Static assets receive no-cache headers. The page loads Firebase App, Firebase Auth, and generated Firebase initialization. Relative /v1 routes reach the API through Hosting rewrites, but the API verifies every token and claim. Direct video upload is the exception: the browser uses a temporary Storage capability URI without attaching the Firebase bearer token.");
}

// 02 Page map
{
  const s = deck.slides.add(); base(s, "Four hosted web applications", 2);
  const root = box(s, 490, 142, 300, 92, C.dark, C.dark, 16);
  text(s, "02-web-ui/", 508, 158, 264, 26, 22, C.white, true, "center");
  text(s, "Firebase Hosting public root", 508, 190, 264, 18, 13, "#C8D9D2", false, "center");
  const pages = [
    ["Vision Agent", "agent.html\nUpload and manage analyses", 54],
    ["Admin All Runs", "allruns.html\nRead across owners", 354],
    ["Inspection Review", "index.html\nReview evidence packages", 654],
    ["Catalog Browser", "catalog.html\nBrowse static catalog", 954],
  ];
  const pageShapes = pages.map(([a,b,x]) => labelBox(s, a, b, x, 340, 270, 144, C.paper, C.teal));
  for (const p of pageShapes) connect(s, root, p, { fromSide: "bottom", toSide: "top", color: C.teal, width: 2 });
  const baseCss = labelBox(s, "base.css", "shared visual primitives", 245, 555, 250, 82, C.pale, C.line);
  const auth = labelBox(s, "Firebase Auth", "three authenticated applications", 760, 555, 280, 82, C.pale, C.line);
  text(s, "Each page has its own controller and API contract", 360, 666, 560, 28, 18, C.muted, false, "center");
  notes(s, "The Hosting root contains four related browser applications. agent.html is the Vision Agent. allruns.html is the administrator companion and requires admin: true. index.html reviews inspection and VISTA evidence packages. catalog.html reads static catalog JSON and product images. These pages share Hosting and base visual language, not one client controller or one API contract.");
}

// 03 Components
{
  const s = deck.slides.add(); base(s, "Vision Agent client structure", 3);
  const page = box(s, 120, 148, 1040, 146, C.paper, C.green, 18);
  text(s, "agent.html · visible browser page", 150, 168, 980, 30, 23, C.ink, true, "center");
  ["Authentication", "Upload composer", "Transfer progress", "Analysis cards"].forEach((label, i) => {
    text(s, label, 166 + i * 250, 226, 200, 28, 17, C.muted, true, "center");
  });

  const styles = labelBox(s, "agent.css + base.css", "styles the visible page", 72, 392, 250, 92, C.pale, C.line);
  const controller = labelBox(s, "agent.js", "events · rendering · transfer · polling", 400, 354, 480, 122, C.mint, C.green);
  const auth = labelBox(s, "Firebase Auth", "current user and ID token", 330, 566, 270, 92, C.paper, C.line);
  const api = labelBox(s, "Agent API", "authenticated analysis requests", 680, 566, 270, 92, C.paper, C.green);

  s.shapes.connect(page, controller, {
    kind: "straight", fromSide: "bottom", toSide: "top",
    line: { style: "solid", fill: C.green, width: 3 },
    head: { type: "arrow", width: "med", length: "med" },
    tail: { type: "arrow", width: "med", length: "med" },
  });
  s.shapes.connect(styles, page, {
    kind: "elbow", fromSide: "top", toSide: "left",
    line: { style: "dash", fill: C.line, width: 2 },
  });
  connect(s, controller, auth, { fromSide: "bottom", toSide: "top", color: C.teal });
  connect(s, controller, api, { fromSide: "bottom", toSide: "top", color: C.green });

  text(s, "DOM events and rendering", 895, 364, 240, 24, 14, C.green, true, "center");
  text(s, "ID token", 315, 518, 170, 22, 14, C.muted, true, "center");
  text(s, "API calls", 795, 518, 170, 22, 14, C.green, true, "center");
  notes(s, "agent.html declares the authenticated and signed-out regions, upload form, progress, analysis cards, and empty state. agent.js sits between those visible regions and external services. It receives DOM events, updates the page, obtains the current Firebase ID token, and sends authenticated Agent API requests. Video functions also reserve sessions, transfer chunks, inspect progress, and recover. agent.css is page-specific while base.css provides shared styling primitives.");
}

// 04 Request sequence
{
  const s = deck.slides.add(); base(s, "Authenticated Agent request", 4);
  const names = ["Person", "agent.js", "Firebase Auth", "Hosting", "Agent API"];
  const xs = [90, 310, 535, 760, 990];
  names.forEach((n,i) => {
    labelBox(s, n, i === 2 || i === 4 ? "external to static page" : "", xs[i], 142, 170, 64, i === 1 ? C.mint : C.paper, i === 1 ? C.green : C.line);
    s.shapes.add({ geometry: "line", position: { left: xs[i] + 85, top: 216, width: 0, height: 420 }, fill: "none", line: { fill: C.line, width: 1.5, style: "dash" } });
  });
  const events = [
    ["1  Trigger action",0,1,250], ["2  Request ID token",1,2,310], ["3  Return token",2,1,370],
    ["4  Send /v1 request + Bearer token",1,3,430], ["5  Rewrite request",3,4,490],
    ["6  Verify identity and role",4,4,550], ["7  Return data or safe error",4,1,610],
  ];
  for (const [label,a,b,y] of events) {
    const x1 = xs[a] + 85, x2 = xs[b] + 85;
    s.shapes.add({ geometry: "line", position: { left: Math.min(x1,x2), top: y, width: Math.abs(x2-x1), height: 0 }, fill: "none", line: { fill: a === b ? C.gold : C.teal, width: 2 } });
    text(s, label, Math.min(x1,x2) + 6, y - 24, Math.max(150, Math.abs(x2-x1) - 12), 22, 13, C.ink, a === b);
  }
  notes(s, "The HTML loads Firebase Auth before agent.js. start() observes onAuthStateChanged(). Before a protected request, authorized() gets the current user's ID token and sets the Authorization header. Hosting forwards the relative route to the API. The API verifies identity, custom claims, and ownership. request() parses the normal response envelope. Server failures retain a safe requestId for diagnosis.");
}

// 05 Lifecycle
{
  const s = deck.slides.add(); base(s, "Upload and observation lifecycle", 5);
  const start = box(s, 470, 136, 340, 74, C.dark, C.dark, 16);
  text(s, "Select and validate file", 490, 158, 300, 25, 21, C.white, true, "center");
  const photo = labelBox(s, "Photograph", "POST JPEG\ncreate record and start run", 90, 286, 300, 122, C.mint, C.green);
  const video = labelBox(s, "Video", "reserve record\ntransfer bytes · complete", 490, 286, 300, 122, C.paper, C.gold);
  const recovery = labelBox(s, "Recovery", "resume · cancel · start fresh", 890, 286, 300, 122, "#FFF4D8", C.gold);
  connect(s, start, photo, { fromSide: "bottom", toSide: "top", color: C.green });
  connect(s, start, video, { fromSide: "bottom", toSide: "top", color: C.gold });
  connect(s, video, recovery, { color: C.gold, dashed: true });
  const observe = labelBox(s, "Observe durable state", "render → wait 15 s → GET again", 365, 500, 550, 104, C.pale, C.teal);
  connect(s, photo, observe, { fromSide: "bottom", toSide: "left", color: C.green });
  connect(s, video, observe, { fromSide: "bottom", toSide: "top", color: C.teal });
  connect(s, recovery, observe, { fromSide: "bottom", toSide: "right", color: C.gold });
  text(s, "Exit: analyzed · failed · cancelled · hidden page · observation ceiling", 250, 648, 780, 28, 17, C.muted, false, "center");
  notes(s, "upload() receives one file. JPEG handling posts multipart data and can start the first run. Video handling reserves an uploading record, transfers bounded chunks to Storage, and calls /complete. Interrupted transfers can retain a local session. The UI offers Resume upload, Cancel upload, or Start fresh. refresh() reads durable records. scheduleObservation() polls every 15 seconds and stops when work settles, the page hides, or ten minutes pass. Polling observes server work; it does not execute recognition.");
}

const candidatePath = path.join(buildDir, "candidate.pptx");
await Promise.all([
  fs.rm(candidatePath, { force: true }),
  fs.rm(finalPath, { force: true }),
  fs.rm(path.join(buildDir, "validation.json"), { force: true }),
]);
await (await PresentationFile.exportPptx(deck)).save(candidatePath);
await finalizePresentation({
  explicitTotalSlideCount: 6,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  workspaceDir,
  candidatePath,
  finalPath,
  pythonExecutable: runtimePython,
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-heading-fit"],
  fontPolicy: { basis: "design", families: [font] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(buildDir, "validation.json"),
});
console.log(JSON.stringify({ finalPath, font }, null, 2));
